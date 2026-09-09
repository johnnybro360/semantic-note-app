import { Pressable, Text, View } from "react-native";

type NoteListErrorStateProps = {
  onRetry: () => void;
};

export function NoteListErrorState({ onRetry }: NoteListErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-lg font-semibold text-slate-200">
        Could not load notes
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
        Please try again.
      </Text>

      <Pressable
        className="mt-4 rounded-lg bg-slate-800 px-5 py-3 active:bg-slate-700"
        onPress={onRetry}
      >
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}
