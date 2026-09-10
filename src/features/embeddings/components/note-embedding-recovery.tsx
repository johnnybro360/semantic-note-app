import { useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";

import { noteKeys } from "@/features/notes/notes.queries";

import { recoverPendingNoteEmbeddings } from "../note-embedding-index.service";

export function NoteEmbeddingRecovery() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    void recoverPendingNoteEmbeddings(database)
      .then(async (summary) => {
        console.log("Pending embedding recovery:", summary);

        if (!isMounted) {
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: noteKeys.all,
        });
      })
      .catch((error: unknown) => {
        console.error("Pending embedding recovery failed:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [database, queryClient]);

  return null;
}
