import type {
  CreateNoteInput,
  EmbeddingStatus,
  Note,
  UpdateNoteInput,
} from "@/features/notes/notes.types";
import type { SQLiteDatabase } from "expo-sqlite";

type NoteRow = {
  id: string;
  title: string;
  body: string;
  embedding_status: EmbeddingStatus;
  created_at: number;
  updated_at: number;
};

type NoteSearchRow = NoteRow & {
  search_rank: number;
};

function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    embeddingStatus: row.embedding_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const notesRepository = {
  async findRecent(database: SQLiteDatabase, limit = 10): Promise<Note[]> {
    const normalizedLimit = Math.max(1, Math.floor(limit));

    const rows = await database.getAllAsync<NoteRow>(
      `
        SELECT
          id,
          title,
          body,
          embedding_status,
          created_at,
          updated_at
        FROM notes
        ORDER BY updated_at DESC
        LIMIT $limit
      `,
      {
        $limit: normalizedLimit,
      },
    );

    return rows.map(mapNoteRow);
  },

  async findAll(database: SQLiteDatabase): Promise<Note[]> {
    const rows = await database.getAllAsync<NoteRow>(`
        SELECT
          id,
          title,
          body,
          embedding_status,
          created_at,
          updated_at
        FROM notes
        ORDER BY updated_at DESC
      `);

    return rows.map(mapNoteRow);
  },

  async findById(database: SQLiteDatabase, id: string): Promise<Note | null> {
    const row = await database.getFirstAsync<NoteRow>(
      `
          SELECT
            id,
            title,
            body,
            embedding_status,
            created_at,
            updated_at
          FROM notes
          WHERE id = $id
        `,
      {
        $id: id,
      },
    );

    return row ? mapNoteRow(row) : null;
  },

  async findByIds(database: SQLiteDatabase, ids: string[]): Promise<Note[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => "?").join(", ");

    const rows = await database.getAllAsync<NoteRow>(
      `
        SELECT
          id,
          title,
          body,
          embedding_status,
          created_at,
          updated_at
        FROM notes
        WHERE id IN (${placeholders})
      `,
      ids,
    );

    const notesById = new Map(
      rows.map((row) => {
        const note = mapNoteRow(row);
        return [note.id, note] as const;
      }),
    );

    /*
     * SQLite does not preserve the order of the IN values.
     * Restore the vector search ranking here.
     */
    return ids.flatMap((id) => {
      const note = notesById.get(id);
      return note ? [note] : [];
    });
  },

  async create(
    database: SQLiteDatabase,
    input: CreateNoteInput,
  ): Promise<Note> {
    const timestamp = Date.now();

    const row = await database.getFirstAsync<NoteRow>(
      `
          INSERT INTO notes (
            id,
            title,
            body,
            embedding_status,
            created_at,
            updated_at
          )
          VALUES (
            lower(hex(randomblob(16))),
            $title,
            $body,
            'pending',
            $createdAt,
            $updatedAt
          )
          RETURNING
            id,
            title,
            body,
            embedding_status,
            created_at,
            updated_at
        `,
      {
        $title: input.title.trim(),
        $body: input.body.trim(),
        $createdAt: timestamp,
        $updatedAt: timestamp,
      },
    );

    if (!row) {
      throw new Error("Failed to create note");
    }

    return mapNoteRow(row);
  },

  async update(
    database: SQLiteDatabase,
    id: string,
    input: UpdateNoteInput,
  ): Promise<Note | null> {
    const row = await database.getFirstAsync<NoteRow>(
      `
          UPDATE notes
          SET
            title = COALESCE($title, title),
            body = COALESCE($body, body),
            embedding_status = 'pending',
            updated_at = $updatedAt
          WHERE id = $id
          RETURNING
            id,
            title,
            body,
            embedding_status,
            created_at,
            updated_at
        `,
      {
        $id: id,
        $title: input.title === undefined ? null : input.title.trim(),
        $body: input.body === undefined ? null : input.body.trim(),
        $updatedAt: Date.now(),
      },
    );

    return row ? mapNoteRow(row) : null;
  },

  async remove(database: SQLiteDatabase, id: string): Promise<boolean> {
    const result = await database.runAsync(
      `
          DELETE FROM notes
          WHERE id = $id
        `,
      {
        $id: id,
      },
    );

    return result.changes > 0;
  },

  async search(
    database: SQLiteDatabase,
    searchText: string,
    limit = 50,
  ): Promise<Note[]> {
    const ftsQuery = buildFtsQuery(searchText);

    if (!ftsQuery) {
      return [];
    }

    const rows = await database.getAllAsync<NoteSearchRow>(
      `
        SELECT
          notes.id,
          notes.title,
          notes.body,
          notes.embedding_status,
          notes.created_at,
          notes.updated_at,
          bm25(notes_fts, 5.0, 1.0) AS search_rank
        FROM notes_fts
        INNER JOIN notes
          ON notes.rowid = notes_fts.rowid
        WHERE notes_fts MATCH $query
        ORDER BY
          search_rank ASC,
          notes.updated_at DESC
        LIMIT $limit
      `,
      {
        $query: ftsQuery,
        $limit: limit,
      },
    );

    return rows.map(mapNoteRow);
  },

  async findByEmbeddingStatus(
    database: SQLiteDatabase,
    status: EmbeddingStatus,
    limit = 50,
  ): Promise<Note[]> {
    const normalizedLimit = Math.max(1, Math.floor(limit));

    const rows = await database.getAllAsync<NoteRow>(
      `
        SELECT
          id,
          title,
          body,
          embedding_status,
          created_at,
          updated_at
        FROM notes
        WHERE embedding_status = $status
        ORDER BY updated_at ASC
        LIMIT $limit
      `,
      {
        $status: status,
        $limit: normalizedLimit,
      },
    );

    return rows.map(mapNoteRow);
  },
};

const FTS_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "did",
  "do",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "with",
]);

function buildFtsQuery(searchText: string): string {
  const terms = searchText
    .trim()
    .split(/\s+/)
    .map((term) =>
      term.trim().replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, ""),
    )
    .filter((term) => term.length > 1)
    .filter((term) => !FTS_STOP_WORDS.has(term.toLowerCase()))
    .map((term) => `"${term.replaceAll('"', '""')}"`);

  return terms.join(" OR ");
}
