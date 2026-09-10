import type { SQLiteDatabase } from "expo-sqlite";

export async function createNotesFtsMigration(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
    USING fts5(
      title,
      body,
      content = 'notes',
      content_rowid = 'rowid',
      tokenize = 'unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS notes_fts_after_insert
    AFTER INSERT ON notes
    BEGIN
      INSERT INTO notes_fts (
        rowid,
        title,
        body
      )
      VALUES (
        new.rowid,
        new.title,
        new.body
      );
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_after_delete
    AFTER DELETE ON notes
    BEGIN
      INSERT INTO notes_fts (
        notes_fts,
        rowid,
        title,
        body
      )
      VALUES (
        'delete',
        old.rowid,
        old.title,
        old.body
      );
    END;

    CREATE TRIGGER IF NOT EXISTS notes_fts_after_update
    AFTER UPDATE OF title, body ON notes
    BEGIN
      INSERT INTO notes_fts (
        notes_fts,
        rowid,
        title,
        body
      )
      VALUES (
        'delete',
        old.rowid,
        old.title,
        old.body
      );

      INSERT INTO notes_fts (
        rowid,
        title,
        body
      )
      VALUES (
        new.rowid,
        new.title,
        new.body
      );
    END;

    INSERT INTO notes_fts(notes_fts)
    VALUES ('rebuild');
  `);
}
