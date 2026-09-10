import { Pressable, Text, View } from "react-native";

import { useRetryNoteEmbedding } from "../notes.queries";
import type { Note } from "../notes.types";

type NoteEmbeddingRetryProps = {
  note: Note;
};

export function NoteEmbeddingRetry({ note }: NoteEmbeddingRetryProps) {
  const retryMutation = useRetryNoteEmbedding();

  if (note.embeddingStatus !== "failed") {
    return null;
  }

  return (
    <View className="mb-4 gap-2 rounded-xl border border-amber-900 bg-amber-950 p-4">
      <Text className="text-sm text-amber-200">
        Semantic search indexing failed for this note.
      </Text>

      <Pressable
        className="items-center rounded-lg bg-amber-600 px-4 py-3 active:bg-amber-700 disabled:opacity-50"
        disabled={retryMutation.isPending}
        onPress={() => retryMutation.mutate(note.id)}
      >
        <Text className="font-semibold text-white">
          {retryMutation.isPending ? "Retrying..." : "Retry embedding"}
        </Text>
      </Pressable>

      {retryMutation.data === "failed" ? (
        <Text className="text-sm text-red-400">
          Retry failed. Please try again later.
        </Text>
      ) : null}
    </View>
  );
}
