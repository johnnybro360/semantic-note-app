import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NoteDetailNotFoundStateProps = {
  onBack: () => void;
};

export function NoteDetailNotFoundState({
  onBack,
}: NoteDetailNotFoundStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-white">Note not found</Text>

        <Text className="mt-2 text-center text-sm text-slate-400">
          It may have already been deleted.
        </Text>

        <Pressable
          className="mt-6 rounded-lg bg-blue-500 px-5 py-3 active:bg-blue-600"
          onPress={onBack}
        >
          <Text className="font-semibold text-white">Return to notes</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
