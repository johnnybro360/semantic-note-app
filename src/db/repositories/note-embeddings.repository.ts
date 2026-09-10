import type { SQLiteDatabase } from "expo-sqlite";
import { loadSQLiteVecExtension } from "../extensions/sqlite-vec";

const EMBEDDING_DIMENSION = 384;

export const EMBEDDING_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";

export const EMBEDDING_MODEL_VERSION = "int8-v1";

export type SemanticNoteMatch = {
  noteId: string;
  distance: number;
  similarity: number;
};

type SemanticNoteMatchRow = {
  note_id: string;
  distance: number;
};

function vectorToBlob(vector: Float32Array): Uint8Array {
  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected a ${EMBEDDING_DIMENSION}-dimensional embedding, received ${vector.length}.`,
    );
  }

  const view = new Uint8Array(
    vector.buffer,
    vector.byteOffset,
    vector.byteLength,
  );

  return Uint8Array.from(view);
}

export const noteEmbeddingsRepository = {
  async replace(
    database: SQLiteDatabase,
    input: {
      noteId: string;
      expectedUpdatedAt: number;
      vector: Float32Array;
    },
  ): Promise<boolean> {
    const embeddingBlob = vectorToBlob(input.vector);
    let wasReplaced = false;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await loadSQLiteVecExtension(transaction);

      const statusResult = await transaction.runAsync(
        `
              UPDATE notes
              SET embedding_status = 'ready'
              WHERE id = $noteId
                AND updated_at = $expectedUpdatedAt
                AND embedding_status = 'pending'
            `,
        {
          $noteId: input.noteId,
          $expectedUpdatedAt: input.expectedUpdatedAt,
        },
      );

      if (statusResult.changes === 0) {
        return;
      }

      await transaction.runAsync(
        `
              DELETE FROM note_embeddings
              WHERE note_id = $noteId
            `,
        {
          $noteId: input.noteId,
        },
      );

      await transaction.runAsync(
        `
              INSERT INTO note_embeddings (
                note_id,
                embedding,
                model_id,
                model_version,
                embedded_at
              )
              VALUES (
                $noteId,
                vec_f32($embedding),
                $modelId,
                $modelVersion,
                $embeddedAt
              )
            `,
        {
          $noteId: input.noteId,
          $embedding: embeddingBlob,
          $modelId: EMBEDDING_MODEL_ID,
          $modelVersion: EMBEDDING_MODEL_VERSION,
          $embeddedAt: Date.now(),
        },
      );

      wasReplaced = true;
    });

    return wasReplaced;
  },

  async markFailed(
    database: SQLiteDatabase,
    noteId: string,
    expectedUpdatedAt: number,
  ): Promise<boolean> {
    const result = await database.runAsync(
      `
        UPDATE notes
        SET embedding_status = 'failed'
        WHERE id = $noteId
          AND updated_at = $expectedUpdatedAt
          AND embedding_status = 'pending'
      `,
      {
        $noteId: noteId,
        $expectedUpdatedAt: expectedUpdatedAt,
      },
    );

    return result.changes > 0;
  },

  async remove(database: SQLiteDatabase, noteId: string): Promise<void> {
    await database.runAsync(
      `
        DELETE FROM note_embeddings
        WHERE note_id = $noteId
      `,
      {
        $noteId: noteId,
      },
    );
  },

  async search(
    database: SQLiteDatabase,
    vector: Float32Array,
    limit = 10,
  ): Promise<SemanticNoteMatch[]> {
    const embeddingBlob = vectorToBlob(vector);
    const normalizedLimit = Math.max(1, Math.floor(limit));

    const rows = await database.getAllAsync<SemanticNoteMatchRow>(
      `
          WITH nearest_matches AS (
            SELECT
              note_id,
              distance
            FROM note_embeddings
            WHERE embedding MATCH vec_f32($embedding)
              AND k = $limit
          )
          SELECT
            nearest_matches.note_id,
            nearest_matches.distance
          FROM nearest_matches
          INNER JOIN notes
            ON notes.id = nearest_matches.note_id
          WHERE notes.embedding_status = 'ready'
          ORDER BY nearest_matches.distance ASC
        `,
      {
        $embedding: embeddingBlob,
        $limit: normalizedLimit,
      },
    );

    return rows.map((row) => ({
      noteId: row.note_id,
      distance: row.distance,
      similarity: 1 - row.distance,
    }));
  },

  async markPending(
    database: SQLiteDatabase,
    noteId: string,
  ): Promise<boolean> {
    const result = await database.runAsync(
      `
        UPDATE notes
        SET embedding_status = 'pending'
        WHERE id = $noteId
          AND embedding_status = 'failed'
      `,
      {
        $noteId: noteId,
      },
    );

    return result.changes > 0;
  },
};
