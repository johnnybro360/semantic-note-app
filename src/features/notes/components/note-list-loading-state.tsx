import { Text, View } from "react-native";

export function NoteListLoadingState() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-sm text-slate-400">Loading notes...</Text>
    </View>
  );
}
