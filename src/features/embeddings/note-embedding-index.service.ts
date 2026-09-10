import type { SQLiteDatabase } from "expo-sqlite";

import { noteEmbeddingsRepository } from "@/db/repositories/note-embeddings.repository";
import type { Note } from "@/features/notes/notes.types";

import { notesRepository } from "@/db/repositories/notes.repository";
import { createEmbedding } from "./embedding.service";

export type NoteEmbeddingIndexResult = "ready" | "failed" | "stale";

export type NoteEmbeddingRecoverySummary = Record<
  NoteEmbeddingIndexResult,
  number
>;

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

const recoveryTasks = new WeakMap<
  SQLiteDatabase,
  Promise<NoteEmbeddingRecoverySummary>
>();

async function runPendingNoteRecovery(
  database: SQLiteDatabase,
): Promise<NoteEmbeddingRecoverySummary> {
  const pendingNotes = await notesRepository.findByEmbeddingStatus(
    database,
    "pending",
    50,
  );

  const summary: NoteEmbeddingRecoverySummary = {
    ready: 0,
    failed: 0,
    stale: 0,
  };

  /*
   * Process sequentially to avoid running multiple model
   * inferences and database writes concurrently.
   */
  for (const note of pendingNotes) {
    const result = await indexNoteEmbedding(database, note);

    summary[result] += 1;
  }

  return summary;
}

export function recoverPendingNoteEmbeddings(
  database: SQLiteDatabase,
): Promise<NoteEmbeddingRecoverySummary> {
  const existingTask = recoveryTasks.get(database);

  if (existingTask) {
    return existingTask;
  }

  const recoveryTask = runPendingNoteRecovery(database).finally(() => {
    recoveryTasks.delete(database);
  });

  recoveryTasks.set(database, recoveryTask);

  return recoveryTask;
}

export async function retryNoteEmbedding(
  database: SQLiteDatabase,
  noteId: string,
): Promise<NoteEmbeddingIndexResult> {
  const wasMarkedPending = await noteEmbeddingsRepository.markPending(
    database,
    noteId,
  );

  if (!wasMarkedPending) {
    return "stale";
  }

  const note = await notesRepository.findById(database, noteId);

  if (!note) {
    return "stale";
  }

  return indexNoteEmbedding(database, note);
}
