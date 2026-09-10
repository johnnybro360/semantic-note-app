import type { SQLiteDatabase } from "expo-sqlite";

import { noteEmbeddingsRepository } from "@/db/repositories/note-embeddings.repository";
import type { Note } from "@/features/notes/notes.types";

import { createEmbedding } from "./embedding.service";

export type NoteEmbeddingIndexResult = "ready" | "failed" | "stale";

function buildNoteEmbeddingText(note: Note): string {
  return [note.title.trim(), note.body.trim()].filter(Boolean).join("\n\n");
}

export async function indexNoteEmbedding(
  database: SQLiteDatabase,
  note: Note,
): Promise<NoteEmbeddingIndexResult> {
  try {
    const text = buildNoteEmbeddingText(note);

    if (!text) {
      throw new Error("Cannot index an empty note.");
    }

    const embedding = await createEmbedding(text);

    const wasStored = await noteEmbeddingsRepository.replace(database, {
      noteId: note.id,
      expectedUpdatedAt: note.updatedAt,
      vector: embedding.vector,
    });

    return wasStored ? "ready" : "stale";
  } catch (error: unknown) {
    console.error(`Failed to create embedding for note ${note.id}:`, error);

    try {
      await noteEmbeddingsRepository.markFailed(
        database,
        note.id,
        note.updatedAt,
      );
    } catch (statusError: unknown) {
      console.error(
        `Failed to mark note ${note.id} embedding as failed:`,
        statusError,
      );
    }

    return "failed";
  }
}
