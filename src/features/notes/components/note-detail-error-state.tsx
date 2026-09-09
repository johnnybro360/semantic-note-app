import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NoteDetailErrorStateProps = {
  onBack: () => void;
  onRetry: () => void;
};

export function NoteDetailErrorState({
  onBack,
  onRetry,
}: NoteDetailErrorStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-white">
          Could not load the note
        </Text>

        <Text className="mt-2 text-center text-sm text-slate-400">
          Please try again.
        </Text>

        <View className="mt-6 flex-row gap-3">
          <Pressable
            className="rounded-lg bg-slate-800 px-5 py-3 active:bg-slate-700"
            onPress={onBack}
          >
            <Text className="font-semibold text-white">Back</Text>
          </Pressable>

          <Pressable
            className="rounded-lg bg-blue-500 px-5 py-3 active:bg-blue-600"
            onPress={onRetry}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
