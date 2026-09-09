import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-5 py-4">
        <View>
          <Text className="text-3xl font-bold text-white">Notes</Text>

          <Text className="mt-1 text-base text-slate-400">
            Find what you remember.
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-semibold text-slate-200">
            No notes yet
          </Text>

          <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
            Save a solution, concept, or reminder clue.
          </Text>
        </View>

        <Pressable
          className="items-center rounded-xl bg-blue-500 px-4 py-4
                     active:bg-blue-600"
          onPress={() => console.log("Create note")}
        >
          <Text className="text-base font-semibold text-white">New note</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
