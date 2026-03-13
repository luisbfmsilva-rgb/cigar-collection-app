import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useState, useMemo } from "react";

// Base de dados global de charutos (exemplo com dados reais)
const GLOBAL_CIGARS = [
  {
    id: "cohiba-robusto",
    brand: "Cohiba",
    name: "Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com" as const,
    averageRating: 92,
    reviewCount: 1250,
  },
  {
    id: "davidoff-millennium",
    brand: "Davidoff",
    name: "Millennium Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "República Dominicana",
    wrapper: "Olor",
    source: "cigar-aficionado" as const,
    averageRating: 88,
    reviewCount: 890,
  },
  {
    id: "montecristo-no2",
    brand: "Montecristo",
    name: "No. 2",
    vitola: "Torpedo",
    ringGauge: 52,
    length: 156,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com" as const,
    averageRating: 94,
    reviewCount: 2100,
  },
  {
    id: "padron-1964",
    brand: "Padron",
    name: "1964 Anniversary Maduro",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Maduro",
    source: "cigar-aficionado" as const,
    averageRating: 91,
    reviewCount: 1560,
  },
  {
    id: "arturo-fuente-opus",
    brand: "Arturo Fuente",
    name: "Opus X",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "República Dominicana",
    wrapper: "Fuente",
    source: "cigar-geeks" as const,
    averageRating: 90,
    reviewCount: 1200,
  },
  {
    id: "partagas-serie-d",
    brand: "Partagás",
    name: "Serie D No. 4",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com" as const,
    averageRating: 89,
    reviewCount: 980,
  },
  {
    id: "oliva-v-melanio",
    brand: "Oliva",
    name: "V Melanio",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Sumatra",
    source: "cigar-aficionado" as const,
    averageRating: 87,
    reviewCount: 650,
  },
  {
    id: "ramon-allones-specially",
    brand: "Ramón Allones",
    name: "Specially Selected",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com" as const,
    averageRating: 88,
    reviewCount: 720,
  },
];

export default function ExploreScreen() {
  const colors = useColors();
  const { cigars, addCigar, humidors } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const filteredCigars = useMemo(() => {
    return GLOBAL_CIGARS.filter((c) => {
      const matchesSearch =
        c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vitola.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = !filterSource || c.source === filterSource;

      return matchesSearch && matchesSource;
    });
  }, [searchQuery, filterSource]);

  const isAlreadyAdded = (globalCigarId: string) => {
    return cigars.some((c) => c.id === globalCigarId);
  };

  const handleAddCigar = async (globalCigar: (typeof GLOBAL_CIGARS)[0]) => {
    if (!humidors.length) {
      Alert.alert(
        "Sem Umidores",
        "Crie um umidor antes de adicionar charutos"
      );
      return;
    }

    try {
      await addCigar({
        brand: globalCigar.brand,
        name: globalCigar.name,
        vitola: globalCigar.vitola,
        ringGauge: globalCigar.ringGauge,
        length: globalCigar.length,
        country: globalCigar.country,
        wrapper: globalCigar.wrapper,
        quantity: 1,
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: 0,
        humidorId: humidors[0].id,
      });

      Alert.alert("Sucesso", `${globalCigar.brand} adicionado ao inventário!`);
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar o charuto");
      console.error(error);
    }
  };

  const sources = ["charutos.com", "cigar-aficionado", "cigar-geeks"];

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
            placeholder="Buscar charuto..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-foreground"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Source Filter */}
        <View className="gap-2">
          <Text className="text-xs font-medium text-muted uppercase">
            Fonte
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFilterSource(null)}
              className={`px-3 py-2 rounded-full border ${
                filterSource === null
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-medium ${
                  filterSource === null ? "text-white" : "text-foreground"
                }`}
              >
                Todos
              </Text>
            </TouchableOpacity>

            {sources.map((source) => (
              <TouchableOpacity
                key={source}
                onPress={() => setFilterSource(source)}
                className={`px-3 py-2 rounded-full border ${
                  filterSource === source
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-xs font-medium ${
                    filterSource === source ? "text-white" : "text-foreground"
                  }`}
                >
                  {source === "charutos.com"
                    ? "Charutos.com"
                    : source === "cigar-aficionado"
                    ? "Cigar Aficionado"
                    : "Cigar Geeks"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List */}
        {filteredCigars.length === 0 ? (
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
                Nenhum Charuto Encontrado
              </Text>
              <Text className="text-sm text-muted text-center max-w-xs">
                Tente uma busca diferente ou explore todas as marcas
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredCigars}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => {
              const alreadyAdded = isAlreadyAdded(item.id);
              return (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-1">
                        <Text className="font-semibold text-foreground text-lg">
                          {item.brand}
                        </Text>
                        <Text className="text-sm text-muted">
                          {item.name}
                        </Text>
                      </View>
                      <View
                        className="rounded-full px-2 py-1"
                        style={{ backgroundColor: colors.primary + "20" }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: colors.primary }}
                        >
                          {item.averageRating}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View className="gap-2">
                      <View className="flex-row gap-2">
                        <View className="flex-1 gap-1">
                          <Text className="text-xs text-muted">Vitola</Text>
                          <Text className="text-sm font-medium text-foreground">
                            {item.vitola}
                          </Text>
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-xs text-muted">Dimensões</Text>
                          <Text className="text-sm font-medium text-foreground">
                            {item.ringGauge}x{item.length}mm
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <View className="flex-1 gap-1">
                          <Text className="text-xs text-muted">País</Text>
                          <Text className="text-sm font-medium text-foreground">
                            {item.country}
                          </Text>
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-xs text-muted">Reviews</Text>
                          <Text className="text-sm font-medium text-foreground">
                            {item.reviewCount}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Source Badge */}
                    <View className="flex-row items-center gap-2">
                      <IconSymbol
                        name="globe"
                        size={14}
                        color={colors.muted}
                      />
                      <Text className="text-xs text-muted">
                        {item.source === "charutos.com"
                          ? "Charutos.com"
                          : item.source === "cigar-aficionado"
                          ? "Cigar Aficionado"
                          : "Cigar Geeks"}
                      </Text>
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity
                      onPress={() => handleAddCigar(item)}
                      disabled={alreadyAdded}
                      className={`rounded-lg py-2 items-center justify-center active:opacity-80 ${
                        alreadyAdded
                          ? "bg-border"
                          : "bg-primary"
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center gap-2">
                        <IconSymbol
                          name={alreadyAdded ? "checkmark.circle.fill" : "plus.circle.fill"}
                          size={16}
                          color={alreadyAdded ? colors.muted : "#FFFFFF"}
                        />
                        <Text
                          className={`font-medium text-sm ${
                            alreadyAdded
                              ? "text-muted"
                              : "text-white"
                          }`}
                        >
                          {alreadyAdded ? "Já Adicionado" : "Adicionar"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
