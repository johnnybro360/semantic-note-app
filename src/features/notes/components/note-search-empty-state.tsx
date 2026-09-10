import { Text, View } from "react-native";

type NoteSearchEmptyStateProps = {
  query: string;
};

export function NoteSearchEmptyState({ query }: NoteSearchEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-lg font-semibold text-slate-200">
        No matching notes
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
        No results were found for &quot;{query}&quot;.
      </Text>
    </View>
  );
}
