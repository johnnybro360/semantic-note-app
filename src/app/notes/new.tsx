import { NoteForm } from "@/features/notes/components/note-form";
import { useCreateNote } from "@/features/notes/notes.queries";
import type { CreateNoteInput } from "@/features/notes/notes.types";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const formEntering = FadeInDown.duration(220);

export default function NewNoteScreen() {
  const router = useRouter();
  const createNote = useCreateNote();

  async function handleSubmit(input: CreateNoteInput) {
    try {
      await createNote.mutateAsync(input);
      router.dismissTo("/");
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: 32,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={formEntering}>
            <View className="mb-6 flex-row items-center">
              <Pressable
                className={`mr-4 rounded-lg px-2 py-2 ${
                  createNote.isPending ? "opacity-50" : "active:bg-slate-800"
                }`}
                disabled={createNote.isPending}
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
