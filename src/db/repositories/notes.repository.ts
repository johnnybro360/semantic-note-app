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
};
