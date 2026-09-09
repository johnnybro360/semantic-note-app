import type { SQLiteDatabase } from "expo-sqlite";

export async function createNotesMigration(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      embedding_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
          embedding_status IN ('pending', 'ready', 'failed')
        ),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_updated_at
    ON notes(updated_at DESC);
  `);
}
