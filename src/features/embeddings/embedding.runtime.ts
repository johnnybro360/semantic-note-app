import { Asset } from "expo-asset";
import { InferenceSession } from "onnxruntime-react-native";

const MODEL_ASSET =
  require("../../../assets/models/all-minilm-l6-v2/model_int8.onnx") as number;

let sessionPromise: Promise<InferenceSession> | null = null;

async function createEmbeddingSession(): Promise<InferenceSession> {
  const modelAsset = Asset.fromModule(MODEL_ASSET);

  await modelAsset.downloadAsync();

  if (!modelAsset.localUri) {
    throw new Error("The embedding model could not be loaded locally.");
  }

  return InferenceSession.create(modelAsset.localUri);
}

export function getEmbeddingSession(): Promise<InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = createEmbeddingSession().catch((error: unknown) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}
