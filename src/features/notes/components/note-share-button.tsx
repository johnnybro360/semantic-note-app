import { useState } from "react";
import { Alert, Pressable, Share, Text } from "react-native";

import type { Note } from "../notes.types";

type NoteShareButtonProps = {
  note: Note;
  disabled?: boolean;
};

function buildShareMessage(note: Note): string {
  const title = note.title.trim() || "Untitled";
  const body = note.body.trim();

  return [title, body].filter(Boolean).join("\n\n");
}

export function NoteShareButton({
  note,
  disabled = false,
}: NoteShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    setIsSharing(true);

    try {
      await Share.share(
        {
          title: note.title.trim() || "Note",
          message: buildShareMessage(note),
        },
        {
          dialogTitle: "Share note",
        },
      );
    } catch (error: unknown) {
      console.error("Failed to share note:", error);

      Alert.alert("Could not share note", "Please try again.");
    } finally {
      setIsSharing(false);
    }
  }

  const isDisabled = disabled || isSharing;

  return (
    <Pressable
      className={`mt-3 items-center rounded-xl border border-blue-500 bg-blue-950 px-4 py-3 ${
        isDisabled ? "opacity-50" : "active:bg-blue-900"
      }`}
      disabled={isDisabled}
      onPress={() => void handleShare()}
    >
      <Text className="text-base font-semibold text-white">
        {isSharing ? "Opening share menu..." : "Share saved note"}
      </Text>
    </Pressable>
  );
}
