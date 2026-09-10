import { DATABASE_NAME, initializeDatabase } from "@/db/database";
import { NoteEmbeddingRecovery } from "@/features/embeddings/components/note-embedding-recovery";
import { BiometricAppLock } from "@/features/security/components/biometric-app-lock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <BiometricAppLock>
          <NoteEmbeddingRecovery />

          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </BiometricAppLock>
      </SQLiteProvider>
    </QueryClientProvider>
  );
}
