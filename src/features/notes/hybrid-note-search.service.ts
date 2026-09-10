import type { SQLiteDatabase } from "expo-sqlite";

import { notesRepository } from "@/db/repositories/notes.repository";

import type { Note } from "./notes.types";
import {
    searchNotesSemantically,
    type SemanticNoteSearchResult,
} from "./semantic-note-search.service";

const RRF_RANK_CONSTANT = 60;

export type HybridNoteSearchResult = {
  note: Note;
  hybridScore: number;
  keywordRank: number | null;
  semanticRank: number | null;
  semanticSimilarity: number | null;
};

function calculateReciprocalRank(rank: number): number {
  return 1 / (RRF_RANK_CONSTANT + rank);
}

export async function searchNotesHybrid(
  database: SQLiteDatabase,
  query: string,
  limit = 10,
): Promise<HybridNoteSearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const normalizedLimit = Math.max(1, Math.floor(limit));

  /*
   * Retrieve more candidates than the final result count so that
   * documents appearing in both result sets receive an RRF boost.
   */
  const candidateLimit = Math.max(20, normalizedLimit * 3);

  const [keywordNotes, semanticResults] = await Promise.all([
    notesRepository.search(database, normalizedQuery, candidateLimit),

    searchNotesSemantically(database, normalizedQuery, candidateLimit),
  ]);

  const candidates = new Map<string, HybridNoteSearchResult>();

  keywordNotes.forEach((note, index) => {
    const rank = index + 1;

    candidates.set(note.id, {
      note,
      hybridScore: calculateReciprocalRank(rank),
      keywordRank: rank,
      semanticRank: null,
      semanticSimilarity: null,
    });
  });

  semanticResults.forEach((semanticResult: SemanticNoteSearchResult, index) => {
    const rank = index + 1;
    const existing = candidates.get(semanticResult.note.id);

    if (existing) {
      existing.hybridScore += calculateReciprocalRank(rank);

      existing.semanticRank = rank;
      existing.semanticSimilarity = semanticResult.similarity;

      return;
    }

    candidates.set(semanticResult.note.id, {
      note: semanticResult.note,
      hybridScore: calculateReciprocalRank(rank),
      keywordRank: null,
      semanticRank: rank,
      semanticSimilarity: semanticResult.similarity,
    });
  });

  return Array.from(candidates.values())
    .sort((left, right) => {
      const scoreDifference = right.hybridScore - left.hybridScore;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const similarityDifference =
        (right.semanticSimilarity ?? Number.NEGATIVE_INFINITY) -
        (left.semanticSimilarity ?? Number.NEGATIVE_INFINITY);

      if (similarityDifference !== 0) {
        return similarityDifference;
      }

      return right.note.updatedAt - left.note.updatedAt;
    })
    .slice(0, normalizedLimit);
}
