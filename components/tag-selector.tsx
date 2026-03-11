import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

const FLAVOR_TAGS = [
  "Couro",
  "Café",
  "Especiarias",
  "Madeira",
  "Terra",
  "Floral",
  "Frutado",
  "Chocolate",
  "Tabaco",
  "Fumaça",
  "Pimenta",
  "Mel",
  "Noz",
  "Baunilha",
  "Cedro",
  "Anis",
  "Caramelo",
  "Manteiga",
  "Cravo",
  "Gengibre",
  "Hortelã",
  "Amêndoa",
  "Canela",
];

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const colors = useColors();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <View className="gap-3">
      <Text className="font-semibold text-foreground">Sabores Identificados</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {FLAVOR_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              className={`rounded-full px-4 py-2 border active:opacity-80`}
              style={{
                backgroundColor: isSelected ? colors.primary : "transparent",
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: isSelected ? "#FFFFFF" : colors.foreground,
                }}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedTags.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-muted">
            Selecionados: {selectedTags.length}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                className="flex-row items-center gap-1 bg-surface border border-border rounded-full px-3 py-1"
              >
                <Text className="text-xs text-foreground">{tag}</Text>
                <Text className="text-xs text-muted">×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
