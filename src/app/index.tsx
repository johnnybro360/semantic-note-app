import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { NoteListEmptyState } from "@/features/notes/components/note-list-empty-state";
import { NoteListErrorState } from "@/features/notes/components/note-list-error-state";
import { NoteListItem } from "@/features/notes/components/note-list-item";
import { NoteListLoadingState } from "@/features/notes/components/note-list-loading-state";
import { NoteSearchEmptyState } from "@/features/notes/components/note-search-empty-state";
import { NoteSearchInput } from "@/features/notes/components/note-search-input";
import { useHybridSearchNotes, useNotes } from "@/features/notes/notes.queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const headerEntering = FadeInDown.duration(220);
const newNoteButtonEntering = FadeInUp.delay(120).duration(220);

export default function NotesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  // /*
  //  * Hooks must always be called unconditionally.
  //  *
  //  * useHybridSearchNotes() internally uses enabled: false when
  //  * normalizedSearchText is empty.
  //  */

  const debouncedSearchText = useDebouncedValue(searchText, 300);

  const normalizedSearchText = debouncedSearchText.trim();

  const isSearching = normalizedSearchText.length > 0;

  const notesQuery = useNotes();

  const searchQuery = useHybridSearchNotes(normalizedSearchText);

  /*
   * Select which query result should currently be displayed.
   */
  const activeQuery = isSearching ? searchQuery : notesQuery;

  const notes = activeQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-5 py-4">
        <Animated.View entering={headerEntering}>
          <View className="mb-4">
            <Text className="text-3xl font-bold text-white">Notes</Text>

            <Text className="mt-1 text-base text-slate-400">
              Find what you remember.
            </Text>
          </View>

          <View className="mb-4">
            <NoteSearchInput value={searchText} onChangeText={setSearchText} />
          </View>
        </Animated.View>

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
            renderItem={({ index, item }) => (
              <NoteListItem
                note={item}
                index={index}
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
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          />
        )}

        <Animated.View entering={newNoteButtonEntering}>
          <Pressable
            className="mt-4 items-center rounded-xl bg-blue-500 px-4 py-4 active:bg-blue-600"
            onPress={() => router.push("/notes/new")}
          >
            <Text className="text-base font-semibold text-white">New note</Text>
          </Pressable>
        </Animated.View>

        {/* <Pressable
          className="mt-3 rounded-xl bg-slate-800 p-4"
          onPress={() => router.push("/dev/embedding")}
        >
          <Text className="text-center text-white">Test embedding runtime</Text>
        </Pressable> */}
      </View>
    </SafeAreaView>
  );
}
