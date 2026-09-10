import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteDetailErrorState } from "@/features/notes/components/note-detail-error-state";
import { NoteDetailLoadingState } from "@/features/notes/components/note-detail-loading-state";
import { NoteDetailNotFoundState } from "@/features/notes/components/note-detail-not-found-state";
import { NoteEmbeddingRetry } from "@/features/notes/components/note-embedding-retry";
import { NoteForm } from "@/features/notes/components/note-form";
import { NoteShareButton } from "@/features/notes/components/note-share-button";
import {
  useDeleteNote,
  useNote,
  useUpdateNote,
} from "@/features/notes/notes.queries";
import type { CreateNoteInput } from "@/features/notes/notes.types";

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const noteQuery = useNote(id);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  async function handleUpdate(input: CreateNoteInput) {
    try {
      const updatedNote = await updateNote.mutateAsync({
        id,
        input,
      });

      if (!updatedNote) {
        Alert.alert(
          "Note not found",
          "This note may have already been deleted.",
        );
        return;
      }

      router.back();
    } catch {
      // The mutation error is displayed by NoteForm.
    }
  }

  async function handleDelete() {
    try {
      await deleteNote.mutateAsync(id);
      router.replace("/");
    } catch {
      Alert.alert("Could not delete note", "Please try again.");
    }
  }

  function confirmDelete() {
    Alert.alert("Delete note?", "This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void handleDelete(),
      },
    ]);
  }

  if (noteQuery.isPending) {
    return <NoteDetailLoadingState />;
  }

  if (noteQuery.isError) {
    return (
      <NoteDetailErrorState
        onBack={() => router.back()}
        onRetry={() => void noteQuery.refetch()}
      />
    );
  }

  if (!noteQuery.data) {
    return <NoteDetailNotFoundState onBack={() => router.replace("/")} />;
  }

  const note = noteQuery.data;
  const isMutating = updateNote.isPending || deleteNote.isPending;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 flex-row items-center">
            <Pressable
              className="mr-4 rounded-lg px-2 py-2 active:bg-slate-800"
              disabled={isMutating}
              onPress={() => router.back()}
            >
              <Text className="text-base text-blue-400">Back</Text>
            </Pressable>

            <Text className="text-2xl font-bold text-white">Edit note</Text>
          </View>

          <NoteEmbeddingRetry note={note} />

          <NoteForm
            initialTitle={note.title}
            initialBody={note.body}
            submitLabel="Save changes"
            isSubmitting={updateNote.isPending}
            errorMessage={
              updateNote.isError
                ? "Could not update the note. Please try again."
                : undefined
            }
            onSubmit={handleUpdate}
          />

          <NoteShareButton note={note} disabled={isMutating} />

          <Pressable
            className={`mt-3 items-center rounded-xl border border-red-900 px-4 py-3 ${
              isMutating ? "opacity-50" : "active:bg-red-950"
            }`}
            disabled={isMutating}
            onPress={confirmDelete}
          >
            <Text className="font-semibold text-red-400">
              {deleteNote.isPending ? "Deleting..." : "Delete note"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
