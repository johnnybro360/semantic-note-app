import { EmbeddingBenchmark } from "@/features/embeddings/components/embedding-benchmark";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmbeddingBenchmarkScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 gap-6 px-5 py-4">
        <Text className="text-2xl font-bold text-white">
          Embedding benchmark
        </Text>

        <EmbeddingBenchmark />
      </View>
    </SafeAreaView>
  );
}
