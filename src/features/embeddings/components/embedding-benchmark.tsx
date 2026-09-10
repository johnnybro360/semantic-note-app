import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getEmbeddingSession } from "../embedding.runtime";
import { createEmbedding } from "../embedding.service";

const BENCHMARK_TEXT =
  "I fixed the Android CMake cache problem by deleting affected build folders.";

type BenchmarkResult = {
  loadTimeMs: number;
  inferenceTimeMs: number;
  tokenCount: number;
  dimension: number;
  inputNames: string[];
  outputNames: string[];
  firstValues: number[];
};

function dotProduct(left: Float32Array, right: Float32Array): number {
  if (left.length !== right.length) {
    throw new Error("Embedding dimensions do not match.");
  }

  let score = 0;

  for (let index = 0; index < left.length; index += 1) {
    score += left[index] * right[index];
  }

  return score;
}

export function EmbeddingBenchmark() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runBenchmark() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadStartedAt = performance.now();

      const session = await getEmbeddingSession();
      const loadTimeMs = performance.now() - loadStartedAt;

      const queryEmbedding = await createEmbedding(
        "How did I fix the Android build after upgrading Worklets?",
      );

      const relatedEmbedding = await createEmbedding(
        "I fixed the Android CMake cache problem by deleting affected build folders.",
      );

      const unrelatedEmbedding = await createEmbedding(
        "Cook rice in a pressure cooker for several minutes.",
      );

      const relatedSimilarity = dotProduct(
        queryEmbedding.vector,
        relatedEmbedding.vector,
      );

      const unrelatedSimilarity = dotProduct(
        queryEmbedding.vector,
        unrelatedEmbedding.vector,
      );

      console.log("Semantic similarity:", {
        related: relatedSimilarity,
        unrelated: unrelatedSimilarity,
      });

      const benchmarkResult: BenchmarkResult = {
        loadTimeMs,
        inferenceTimeMs: queryEmbedding.inferenceTimeMs,
        tokenCount: queryEmbedding.tokenCount,
        dimension: queryEmbedding.vector.length,
        inputNames: Array.from(session.inputNames),
        outputNames: Array.from(session.outputNames),
        firstValues: Array.from(queryEmbedding.vector.slice(0, 5)),
      };

      console.log("Embedding benchmark:", benchmarkResult);

      setResult(benchmarkResult);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to run the embedding benchmark.";

      console.error("Embedding benchmark failed:", error);

      setErrorMessage(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="gap-4">
      <Pressable
        className="items-center rounded-xl bg-blue-500 px-4 py-4 active:bg-blue-600"
        disabled={isLoading}
        onPress={runBenchmark}
      >
        <Text className="font-semibold text-white">
          {isLoading ? "Loading model..." : "Load embedding model"}
        </Text>
      </Pressable>

      {errorMessage ? (
        <Text className="text-red-400">{errorMessage}</Text>
      ) : null}

      {result ? (
        <View className="gap-2 rounded-xl bg-slate-900 p-4">
          <Text className="text-white">
            Session load: {result.loadTimeMs.toFixed(0)} ms
          </Text>

          <Text className="text-white">
            Inference: {result.inferenceTimeMs.toFixed(0)} ms
          </Text>

          <Text className="text-slate-300">Tokens: {result.tokenCount}</Text>

          <Text className="text-slate-300">Dimensions: {result.dimension}</Text>

          <Text className="text-slate-300">
            Inputs: {result.inputNames.join(", ")}
          </Text>

          <Text className="text-slate-300">
            Outputs: {result.outputNames.join(", ")}
          </Text>

          <Text className="text-slate-400" numberOfLines={2}>
            First values: {result.firstValues.join(", ")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
