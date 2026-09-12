# Noteapp

An **on-device notes app** for Android that finds notes by meaning, not just keywords.

Notes never leave the phone. Search runs locally: SQLite FTS5 for exact terms, a MiniLM embedding model for semantic similarity, and Reciprocal Rank Fusion to merge both rankings.

Built with Expo SDK 57, React Native, and TypeScript as a portfolio project in mobile architecture, on-device ML, and information retrieval.

## Why this project

Most note apps either search text literally or send content to a cloud model. This app does hybrid retrieval entirely on the device:

- **Keyword search** via SQLite FTS5 (`unicode61` tokenizer, content-sync triggers)
- **Semantic search** via `all-MiniLM-L6-v2` (ONNX Runtime, 384-d vectors)
- **Vector index** via the bundled `sqlite-vec` extension (`vec0`, cosine distance)
- **Fusion** with Reciprocal Rank Fusion so a note that matches both signals ranks higher

That combination is the interesting part for hiring conversations: native mobile constraints, inference, storage, and search ranking in one product.

## Features

- Create, edit, and list notes with optimistic UI via TanStack Query
- Hybrid search as you type (300ms debounce)
- Background embedding after save, with pending / ready / failed status
- Startup recovery that re-indexes notes whose embeddings were skipped or failed
- Biometric app lock (fingerprint / face) that re-locks when the app backgrounds
- Native share sheet for a note
- Dev screen for embedding latency benchmarks

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Expo Router screens  (list / detail / create / benchmark)  │
│  TanStack Query  ·  NativeWind  ·  Reanimated               │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  Notes repository     Hybrid search        Embedding pipeline
  CRUD + FTS5          FTS ∥ MiniLM         WordPiece tokenizer
                       Reciprocal Rank      ONNX session
                       Fusion               mean-pool + L2 norm
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                    expo-sqlite  (WAL)
                    notes · notes_fts · note_embeddings (vec0)
```

Notes and vectors live in one SQLite database. FTS stays in sync with SQL triggers. When a note’s title or body changes, its vector row is deleted and the note is marked `pending` so indexing can catch up without blocking the UI.

## Search ranking

1. Run FTS5 keyword search and MiniLM vector search in parallel.
2. Pull extra candidates (about 3× the page size) so overlap can boost scores.
3. Score each candidate with Reciprocal Rank Fusion: `1 / (60 + rank)`.
4. Notes that appear in both lists accumulate both ranks.
5. Ties break on cosine similarity, then `updated_at`.

## On-device embeddings

- Model: **all-MiniLM-L6-v2** (384 dimensions), loaded with ONNX Runtime for React Native
- Tokenizer: WordPiece implementation matching the model vocab (no cloud tokenizer)
- Pooling: attention-masked mean pool, then L2 normalize
- Index: `sqlite-vec` `FLOAT[384]` with cosine distance
- Native wiring: custom Expo config plugin registers `OnnxruntimePackage` in Kotlin `MainApplication`

Because this uses native ONNX and sqlite-vec, the app needs a **development build**, not Expo Go.

## Stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 57, React Native 0.86, React 19, TypeScript (strict) |
| Navigation | Expo Router (file-based, typed routes) |
| Data | expo-sqlite, FTS5, sqlite-vec, WAL + foreign keys |
| Async state | TanStack Query |
| On-device ML | onnxruntime-react-native, bundled MiniLM + tokenizer assets |
| Security | expo-local-authentication (strong biometrics) |
| UI | NativeWind (Tailwind), React Native Reanimated |
| Package manager | Bun |

## Project layout

```
src/
  app/                         Expo Router screens
  db/
    database.ts                WAL, sqlite-vec, migrations
    migrations/                notes, FTS5, vec0 embeddings
    repositories/              notes + embedding vectors
  features/
    notes/                     CRUD, hybrid/semantic search, UI
    embeddings/                ONNX runtime, tokenizer, indexing
    security/                  biometric lock
  hooks/
plugins/                       Expo config plugin for ONNX
assets/models/all-minilm-l6-v2/
```

Route files stay in `src/app/`. Domain logic lives in `src/features/` and `src/db/` so screens stay thin.

## Getting started

Requires [Bun](https://bun.sh), [Android Studio](https://developer.android.com/studio) (or a device), and JDK for a native Android build.

```bash
bun install
bunx expo run:android
```

`expo run:android` compiles a development client with ONNX Runtime and sqlite-vec, then starts Metro.

Useful commands:

```bash
bunx expo start          # Metro (after a native build exists)
bunx expo lint
bunx tsc --noEmit
bunx expo-doctor
```

iOS is not the current target; biometric copy and the ONNX config plugin are Android-oriented.

## Privacy

Notes, embeddings, and search all stay on device. There is no account, sync, or inference API. Biometrics gate access to the local database; they are not sent anywhere.

## What I would talk through in an interview

- Why hybrid retrieval beats keyword-only search for messy personal notes
- Why RRF is a simple, rank-based fusion that does not need calibrated scores
- How to keep SQLite, FTS, and a vector table consistent under edits and deletes
- How to run transformer inference on a phone without blocking the UI
- Why Expo config plugins matter when a native module is not auto-linked
- Tradeoffs of on-device MiniLM vs. a hosted embedding API (privacy, latency, quality, APK size)

## License

Private / portfolio project. Ask before reusing the code.
