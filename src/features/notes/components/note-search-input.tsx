import { Pressable, Text, TextInput, View } from "react-native";

type NoteSearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function NoteSearchInput({ value, onChangeText }: NoteSearchInputProps) {
  return (
    <View className="flex-row items-center rounded-xl border border-slate-800 bg-slate-900 px-4">
      <TextInput
        className="flex-1 py-3 text-base text-white"
        value={value}
        onChangeText={onChangeText}
        placeholder="Search your notes..."
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {value ? (
        <Pressable
          className="ml-2 rounded-lg px-2 py-2 active:bg-slate-800"
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
        >
          <Text className="text-sm font-medium text-slate-400">Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
