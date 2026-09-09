import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function NoteDetailLoadingState() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#60a5fa" />

        <Text className="mt-3 text-sm text-slate-400">Loading note...</Text>
      </View>
    </SafeAreaView>
  );
}
