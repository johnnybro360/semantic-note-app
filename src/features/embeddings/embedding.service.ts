import { Tensor } from "onnxruntime-react-native";

import { getEmbeddingSession } from "./embedding.runtime";
import { tokenizeForEmbedding } from "./embedding.tokenizer";

const EMBEDDING_DIMENSION = 384;

export type EmbeddingResult = {
  vector: Float32Array;
  tokenCount: number;
  inferenceTimeMs: number;
};

function createInt64Tensor(values: number[]): Tensor {
  const data = new BigInt64Array(values.length);

  for (let index = 0; index < values.length; index += 1) {
    data[index] = BigInt(values[index]);
  }

  return new Tensor("int64", data, [1, values.length]);
}

function meanPoolAndNormalize(
  hiddenState: Tensor,
  attentionMask: number[],
): Float32Array {
  const [batchSize, sequenceLength, hiddenSize] = hiddenState.dims;

  if (
    batchSize !== 1 ||
    sequenceLength !== attentionMask.length ||
    hiddenSize !== EMBEDDING_DIMENSION
  ) {
    throw new Error(
      `Unexpected embedding output dimensions: ${hiddenState.dims.join(" × ")}`,
    );
  }

  if (!(hiddenState.data instanceof Float32Array)) {
    throw new Error("Expected the embedding model to return float32 data.");
  }

  const pooled = new Float32Array(hiddenSize);
  let includedTokenCount = 0;

  for (let tokenIndex = 0; tokenIndex < sequenceLength; tokenIndex += 1) {
    if (attentionMask[tokenIndex] === 0) {
      continue;
    }

    const tokenOffset = tokenIndex * hiddenSize;

    for (
      let embeddingIndex = 0;
      embeddingIndex < hiddenSize;
      embeddingIndex += 1
    ) {
      pooled[embeddingIndex] += hiddenState.data[tokenOffset + embeddingIndex];
    }

    includedTokenCount += 1;
  }

  if (includedTokenCount === 0) {
    throw new Error("Cannot pool an embedding without active tokens.");
  }

  let squaredMagnitude = 0;

  for (let index = 0; index < pooled.length; index += 1) {
    pooled[index] /= includedTokenCount;
    squaredMagnitude += pooled[index] * pooled[index];
  }

  const magnitude = Math.sqrt(squaredMagnitude);

  if (magnitude === 0) {
    throw new Error("Cannot normalize a zero-length embedding.");
  }

  for (let index = 0; index < pooled.length; index += 1) {
    pooled[index] /= magnitude;
  }

  return pooled;
}

export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Cannot create an embedding from empty text.");
  }

  const tokenized = tokenizeForEmbedding(normalizedText);
  const session = await getEmbeddingSession();

  const startedAt = performance.now();

  const outputs = await session.run({
    input_ids: createInt64Tensor(tokenized.inputIds),
    attention_mask: createInt64Tensor(tokenized.attentionMask),
    token_type_ids: createInt64Tensor(tokenized.tokenTypeIds),
  });

  const finishedAt = performance.now();
  const hiddenState = outputs.last_hidden_state;

  if (!hiddenState) {
    throw new Error("The model did not return last_hidden_state.");
  }

  return {
    vector: meanPoolAndNormalize(hiddenState, tokenized.attentionMask),
    tokenCount: tokenized.inputIds.length,
    inferenceTimeMs: finishedAt - startedAt,
  };
}
