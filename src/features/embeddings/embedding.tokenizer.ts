import tokenizerDefinition from "../../../assets/models/all-minilm-l6-v2/tokenizer.json";

const DEFAULT_MAX_LENGTH = 256;
const MAX_INPUT_CHARACTERS_PER_WORD = 100;

const vocabulary = tokenizerDefinition.model.vocab as Record<string, number>;

function getRequiredTokenId(token: string): number {
  const tokenId = vocabulary[token];

  if (tokenId === undefined) {
    throw new Error(`Required tokenizer token is missing: ${token}`);
  }

  return tokenId;
}

const PAD_TOKEN_ID = getRequiredTokenId("[PAD]");
const UNKNOWN_TOKEN_ID = getRequiredTokenId("[UNK]");
const CLASS_TOKEN_ID = getRequiredTokenId("[CLS]");
const SEPARATOR_TOKEN_ID = getRequiredTokenId("[SEP]");

export type TokenizedEmbeddingInput = {
  inputIds: number[];
  attentionMask: number[];
  tokenTypeIds: number[];
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitIntoBasicTokens(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

function tokenizeWordPiece(token: string): number[] {
  if (token.length > MAX_INPUT_CHARACTERS_PER_WORD) {
    return [UNKNOWN_TOKEN_ID];
  }

  const tokenIds: number[] = [];
  let start = 0;

  while (start < token.length) {
    let end = token.length;
    let matchedTokenId: number | undefined;

    while (start < end) {
      const substring = token.slice(start, end);
      const candidate = start === 0 ? substring : `##${substring}`;
      const candidateId = vocabulary[candidate];

      if (candidateId !== undefined) {
        matchedTokenId = candidateId;
        break;
      }

      end -= 1;
    }

    if (matchedTokenId === undefined) {
      return [UNKNOWN_TOKEN_ID];
    }

    tokenIds.push(matchedTokenId);
    start = end;
  }

  return tokenIds;
}

export function tokenizeForEmbedding(
  text: string,
  maxLength = DEFAULT_MAX_LENGTH,
): TokenizedEmbeddingInput {
  if (maxLength < 2) {
    throw new Error("Tokenizer maxLength must be at least 2.");
  }

  const normalizedText = normalizeText(text);
  const basicTokens = splitIntoBasicTokens(normalizedText);
  const contentTokenIds: number[] = [];

  const maximumContentLength = maxLength - 2;

  for (const token of basicTokens) {
    const tokenIds = tokenizeWordPiece(token);
    const availableLength = maximumContentLength - contentTokenIds.length;

    if (availableLength <= 0) {
      break;
    }

    contentTokenIds.push(...tokenIds.slice(0, availableLength));
  }

  const inputIds = [CLASS_TOKEN_ID, ...contentTokenIds, SEPARATOR_TOKEN_ID];

  return {
    inputIds,
    attentionMask: inputIds.map(() => 1),
    tokenTypeIds: inputIds.map(() => 0),
  };
}

export const embeddingTokenizerMetadata = {
  maximumSequenceLength: DEFAULT_MAX_LENGTH,
  paddingTokenId: PAD_TOKEN_ID,
} as const;
