import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteListEmptyState } from "@/features/notes/components/note-list-empty-state";
import { NoteListErrorState } from "@/features/notes/components/note-list-error-state";
import { NoteListItem } from "@/features/notes/components/note-list-item";
import { NoteListLoadingState } from "@/features/notes/components/note-list-loading-state";
import { NoteSearchEmptyState } from "@/features/notes/components/note-search-empty-state";
import { NoteSearchInput } from "@/features/notes/components/note-search-input";
import { useNotes, useSearchNotes } from "@/features/notes/notes.queries";

export default function NotesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const normalizedSearchText = searchText.trim();
  const isSearching = normalizedSearchText.length > 0;

  /*
   * Hooks must always be called unconditionally.
   *
   * useSearchNotes() internally uses enabled: false when
   * normalizedSearchText is empty.
   */
  const notesQuery = useNotes();
  const searchQuery = useSearchNotes(normalizedSearchText);

  /*
   * Select which query result should currently be displayed.
   */
  const activeQuery = isSearching ? searchQuery : notesQuery;

  const notes = activeQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-5 py-4">
        <View className="mb-4">
          <Text className="text-3xl font-bold text-white">Notes</Text>

          <Text className="mt-1 text-base text-slate-400">
            Find what you remember.
          </Text>
        </View>

        <View className="mb-4">
          <NoteSearchInput value={searchText} onChangeText={setSearchText} />
        </View>

        {activeQuery.isPending ? (
          <NoteListLoadingState />
        ) : activeQuery.isError ? (
          <NoteListErrorState onRetry={() => void activeQuery.refetch()} />
        ) : (
          <FlatList
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              gap: 12,
            }}
            data={notes}
            keyExtractor={(note) => note.id}
            renderItem={({ item }) => (
              <NoteListItem
                note={item}
                onPress={() =>
                  router.push({
                    pathname: "/notes/[id]",
                    params: {
                      id: item.id,
                    },
                  })
                }
              />
            )}
            ListEmptyComponent={
              isSearching ? (
                <NoteSearchEmptyState query={normalizedSearchText} />
              ) : (
                <NoteListEmptyState />
              )
            }
            refreshing={activeQuery.isRefetching}
            onRefresh={() => void activeQuery.refetch()}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <Pressable
          className="mt-4 items-center rounded-xl bg-blue-500 px-4 py-4 active:bg-blue-600"
          onPress={() => router.push("/notes/new")}
        >
          <Text className="text-base font-semibold text-white">New note</Text>
        </Pressable>
        <Pressable
          className="mt-3 rounded-xl bg-slate-800 p-4"
          onPress={() => router.push("/dev/embedding")}
        >
          <Text className="text-center text-white">Test embedding runtime</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
