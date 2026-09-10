import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import type { CreateNoteInput } from "../notes.types";

type NoteFormProps = {
  initialTitle?: string;
  initialBody?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateNoteInput) => Promise<void>;
};

export function NoteForm({
  initialTitle = "",
  initialBody = "",
  submitLabel,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  const hasContent = Boolean(title.trim() || body.trim());
  const canSubmit = hasContent && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
    });
  }

  return (
    <View className="gap-4">
      <View>
        <Text className="mb-2 text-sm font-medium text-slate-300">Title</Text>

        <TextInput
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white"
          value={title}
          onChangeText={setTitle}
          placeholder="What was this about?"
          placeholderTextColor="#64748b"
          autoFocus
          returnKeyType="next"
        />
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-slate-300">Note</Text>

        <TextInput
          className="min-h-64 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-base leading-6 text-white"
          value={body}
          onChangeText={setBody}
          placeholder="Write a solution, concept, or reminder clue..."
          placeholderTextColor="#64748b"
          multiline
          textAlignVertical="top"
        />
      </View>

      {errorMessage ? (
        <Text className="text-sm text-red-400">{errorMessage}</Text>
      ) : null}

      <Pressable
        className={`mt-4 items-center rounded-xl px-4 py-4 ${
          canSubmit
            ? "bg-blue-500 active:bg-blue-600"
            : "bg-slate-800 opacity-60"
        }`}
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
      >
        <Text className="text-base font-semibold text-white">
          {isSubmitting ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}
