import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Keyboard,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { IconSymbol } from "./ui/icon-symbol";

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  required?: boolean;
}

export function AutocompleteInput({
  label,
  placeholder,
  value,
  onChangeText,
  suggestions,
  onSelectSuggestion,
  required = false,
}: AutocompleteInputProps) {
  const colors = useColors();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-foreground">
          {label}
        </Text>
        {required && <Text className="text-error">*</Text>}
      </View>

      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            if (value && filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
          style={{ fontSize: 14 }}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <View
            className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg mt-1 z-50"
            style={{ maxHeight: 200 }}
          >
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(item)}
                  className="px-3 py-2 border-b border-border active:bg-primary/10"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm text-foreground">{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-border" />
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
