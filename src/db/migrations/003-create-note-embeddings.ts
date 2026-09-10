import type { SQLiteDatabase } from "expo-sqlite";

export async function createNoteEmbeddingsMigration(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    CREATE VIRTUAL TABLE note_embeddings USING vec0(
      note_id TEXT PRIMARY KEY,
      embedding FLOAT[384] DISTANCE_METRIC=cosine,
      +model_id TEXT,
      +model_version TEXT,
      +embedded_at INTEGER
    );

    CREATE TRIGGER notes_delete_embedding
    AFTER DELETE ON notes
    BEGIN
      DELETE FROM note_embeddings
      WHERE note_id = OLD.id;
    END;

    CREATE TRIGGER notes_update_embedding
    AFTER UPDATE OF title, body ON notes
    BEGIN
      DELETE FROM note_embeddings
      WHERE note_id = NEW.id;
    END;

    UPDATE notes
    SET embedding_status = 'pending';
  `);
}
