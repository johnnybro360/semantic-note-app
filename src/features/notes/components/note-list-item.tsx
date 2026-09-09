import { Pressable, Text } from "react-native";
import { Note } from "../notes.types";
import { formatUpdatedAt } from "../notes.utils";

type NoteListItemProps = {
  note: Note;
  onPress: () => void;
};

export function NoteListItem({ note, onPress }: NoteListItemProps) {
  const preview = note.body || "No additional content";

  return (
    <Pressable
      className="rounded-2xl border border-slate-800 bg-slate-900 p-4 active:bg-slate-800"
      onPress={onPress}
    >
      <Text className="text-lg font-semibold text-white" numberOfLines={1}>
        {note.title || "Untitled"}
      </Text>

      <Text className="mt-2 text-sm leading-5 text-slate-400" numberOfLines={2}>
        {preview}
      </Text>

      <Text className="mt-3 text-xs text-slate-600">
        {formatUpdatedAt(note.updatedAt)}
      </Text>
    </Pressable>
  );
}
