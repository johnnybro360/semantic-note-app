import { useRouter } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteForm } from "@/features/notes/components/note-form";
import { useCreateNote } from "@/features/notes/notes.queries";
import type { CreateNoteInput } from "@/features/notes/notes.types";

export default function NewNoteScreen() {
  const router = useRouter();
  const createNote = useCreateNote();

  async function handleSubmit(input: CreateNoteInput) {
    try {
      const note = await createNote.mutateAsync(input);

      router.replace({
        pathname: "/notes/[id]",
        params: {
          id: note.id,
        },
      });
    } catch {
      // The mutation exposes the error through createNote.isError.
      // Detailed logging can be added separately.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-5 py-4">
          <View className="mb-6 flex-row items-center">
            <Pressable
              className="mr-4 rounded-lg px-2 py-2 active:bg-slate-800"
              onPress={() => router.back()}
            >
              <Text className="text-base text-blue-400">Cancel</Text>
            </Pressable>

            <Text className="text-2xl font-bold text-white">New note</Text>
          </View>

          <NoteForm
            submitLabel="Save note"
            isSubmitting={createNote.isPending}
            errorMessage={
              createNote.isError
                ? "Could not save the note. Please try again."
                : undefined
            }
            onSubmit={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
