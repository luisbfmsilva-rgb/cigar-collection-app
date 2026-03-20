import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { COMPLETE_CIGARS_DATABASE } from "@/lib/cigars-database-complete";
import { useState, useMemo } from "react";

export default function ExploreScreen() {
  const colors = useColors();
  const { cigars, addCigar, humidors } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const filteredCigars = useMemo(() => {
    return COMPLETE_CIGARS_DATABASE.filter((c) => {
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

  const handleAddCigar = async (globalCigar: (typeof COMPLETE_CIGARS_DATABASE)[0]) => {
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
        {/* Header */}
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">
            Explorar
          </Text>
          <Text className="text-sm text-muted">
            Descubra {COMPLETE_CIGARS_DATABASE.length}+ charutos
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
          <Text style={{ fontSize: 18 }}>🔍</Text>
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
              <Text style={{ fontSize: 32 }}>🔍</Text>
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
            scrollEnabled={true}
            nestedScrollEnabled={true}
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
                      <Text style={{ fontSize: 14 }}>🌐</Text>
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
                        <Text style={{ fontSize: 16 }}>
                          {alreadyAdded ? "✓" : "+"}
                        </Text>
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
      </ScrollView>
    </ScreenContainer>
  );
}
