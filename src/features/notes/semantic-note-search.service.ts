import type { SQLiteDatabase } from "expo-sqlite";

import {
    noteEmbeddingsRepository,
    type SemanticNoteMatch,
} from "@/db/repositories/note-embeddings.repository";
import { notesRepository } from "@/db/repositories/notes.repository";
import { createEmbedding } from "@/features/embeddings/embedding.service";

import type { Note } from "./notes.types";

export type SemanticNoteSearchResult = {
  note: Note;
  distance: number;
  similarity: number;
};

export async function searchNotesSemantically(
  database: SQLiteDatabase,
  query: string,
  limit = 10,
): Promise<SemanticNoteSearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const queryEmbedding = await createEmbedding(normalizedQuery);

  const matches = await noteEmbeddingsRepository.search(
    database,
    queryEmbedding.vector,
    limit,
  );

  const notes = await notesRepository.findByIds(
    database,
    matches.map((match) => match.noteId),
  );

  const matchesByNoteId = new Map<string, SemanticNoteMatch>(
    matches.map((match) => [match.noteId, match]),
  );

  return notes.flatMap((note) => {
    const match = matchesByNoteId.get(note.id);

    if (!match) {
      return [];
    }

    return [
      {
        note,
        distance: match.distance,
        similarity: match.similarity,
      },
    ];
  });
}
