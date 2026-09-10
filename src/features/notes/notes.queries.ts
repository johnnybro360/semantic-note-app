import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";

import { indexNoteEmbedding } from "@/features/embeddings/note-embedding-index.service";

import { notesRepository } from "@/db/repositories/notes.repository";
import type { CreateNoteInput, Note, UpdateNoteInput } from "./notes.types";
import { searchNotesSemantically } from "./semantic-note-search.service";

export const noteKeys = {
  all: ["notes"] as const,
  list: () => [...noteKeys.all, "list"] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
  searches: () => [...noteKeys.all, "search"] as const,
  search: (query: string) => [...noteKeys.searches(), query] as const,
  semanticSearch: (query: string) =>
    [...noteKeys.searches(), "semantic", query] as const,
};

type ScheduleNoteEmbeddingOptions = {
  database: SQLiteDatabase;
  queryClient: QueryClient;
  note: Note;
};

function scheduleNoteEmbedding({
  database,
  queryClient,
  note,
}: ScheduleNoteEmbeddingOptions): void {
  void indexNoteEmbedding(database, note)
    .then(async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: noteKeys.detail(note.id),
        }),
        queryClient.invalidateQueries({
          queryKey: noteKeys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: noteKeys.searches(),
        }),
      ]);
    })
    .catch((error: unknown) => {
      /*
       * indexNoteEmbedding handles expected embedding failures.
       * This catch also prevents cache refresh failures from becoming
       * unhandled promise rejections.
       */
      console.error(
        `Embedding background task failed for note ${note.id}:`,
        error,
      );
    });
}

export function useNotes() {
  const database = useSQLiteContext();

  return useQuery({
    queryKey: noteKeys.list(),
    queryFn: () => notesRepository.findAll(database),
  });
}

export function useNote(id: string) {
  const database = useSQLiteContext();

  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesRepository.findById(database, id),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) =>
      notesRepository.create(database, input),

    onSuccess: async (note) => {
      queryClient.setQueryData(noteKeys.detail(note.id), note);

      scheduleNoteEmbedding({
        database,
        queryClient,
        note,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: noteKeys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: noteKeys.searches(),
        }),
      ]);
    },
  });
}

export function useUpdateNote() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      notesRepository.update(database, id, input),

    onSuccess: async (note) => {
      if (!note) {
        return;
      }

      queryClient.setQueryData(noteKeys.detail(note.id), note);

      scheduleNoteEmbedding({
        database,
        queryClient,
        note,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: noteKeys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: noteKeys.searches(),
        }),
      ]);
    },
  });
}

export function useDeleteNote() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesRepository.remove(database, id),

    onSuccess: async (_, id) => {
      queryClient.removeQueries({
        queryKey: noteKeys.detail(id),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: noteKeys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: noteKeys.searches(),
        }),
      ]);
    },
  });
}

export function useSearchNotes(query: string) {
  const database = useSQLiteContext();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: noteKeys.search(normalizedQuery),
    queryFn: () => notesRepository.search(database, normalizedQuery),
    enabled: normalizedQuery.length > 0,
  });
}

export function useSemanticSearchNotes(query: string) {
  const database = useSQLiteContext();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: noteKeys.semanticSearch(normalizedQuery),

    queryFn: () => searchNotesSemantically(database, normalizedQuery),

    select: (results) => results.map((result) => result.note),

    enabled: normalizedQuery.length > 0,
  });
}
