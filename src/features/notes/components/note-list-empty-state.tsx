import { Text, View } from "react-native";

export function NoteListEmptyState() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold text-slate-200">No notes yet</Text>

      <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
        Save a solution, concept, or reminder clue.
      </Text>
    </View>
  );
}
