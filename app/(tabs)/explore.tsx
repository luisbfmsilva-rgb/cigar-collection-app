import { ScrollView, Text, View, TouchableOpacity, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function ExploreScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">
            Explorar
          </Text>
          <Text className="text-sm text-muted">
            Descubra novos charutos
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.muted}
          />
          <TextInput
            placeholder="Buscar marca ou charuto..."
            placeholderTextColor={colors.muted}
            className="flex-1 text-foreground"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity className="bg-surface border border-border rounded-full px-4 py-2 active:opacity-80">
            <Text className="text-sm font-medium text-foreground">
              País
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-surface border border-border rounded-full px-4 py-2 active:opacity-80">
            <Text className="text-sm font-medium text-foreground">
              Vitola
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-surface border border-border rounded-full px-4 py-2 active:opacity-80">
            <Text className="text-sm font-medium text-foreground">
              Preço
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-surface border border-border rounded-full px-4 py-2 active:opacity-80">
            <Text className="text-sm font-medium text-foreground">
              Avaliação
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Empty State */}
        <View className="flex-1 items-center justify-center gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <IconSymbol
              name="magnifyingglass"
              size={32}
              color={colors.primary}
            />
          </View>
          <View className="items-center gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Base de Dados em Desenvolvimento
            </Text>
            <Text className="text-sm text-muted text-center max-w-xs">
              A base de dados de charutos será integrada em breve com dados de Charutos.com, Cigar Aficionado e Cigar Geeks
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
