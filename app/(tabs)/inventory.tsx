import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

export default function InventoryScreen() {
  const colors = useColors();
  const { cigars, deleteCigar, humidors } = useData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCigars = useMemo(() => {
    return cigars.filter(
      (c) =>
        c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vitola.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cigars, searchQuery]);

  const handleDelete = (id: string, brand: string, name: string) => {
    Alert.alert(
      "Deletar Charuto",
      `Tem certeza que deseja deletar ${brand} - ${name}?`,
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Deletar",
          onPress: async () => {
            try {
              await deleteCigar(id);
              Alert.alert("Sucesso", "Charuto deletado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao deletar o charuto");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getHumidorName = (humidorId: string) => {
    return humidors.find((h) => h.id === humidorId)?.name || "Desconhecido";
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">
            Inventário
          </Text>
          <Text className="text-sm text-muted">
            {cigars.length} charuto{cigars.length !== 1 ? "s" : ""}
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

        {/* List or Empty State */}
        {filteredCigars.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <IconSymbol
                name="square.stack.fill"
                size={32}
                color={colors.primary}
              />
            </View>
            <View className="items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">
                {searchQuery ? "Nenhum Charuto Encontrado" : "Nenhum Charuto"}
              </Text>
              <Text className="text-sm text-muted text-center max-w-xs">
                {searchQuery
                  ? "Tente uma busca diferente"
                  : "Comece adicionando seus charutos à coleção"}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredCigars}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <View
                className="bg-surface rounded-xl p-4 border border-border"
              >
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
                    <TouchableOpacity
                      onPress={() =>
                        handleDelete(item.id, item.brand, item.name)
                      }
                      className="active:opacity-60"
                      activeOpacity={0.6}
                    >
                      <IconSymbol
                        name="trash"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Details Grid */}
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
                        <Text className="text-xs text-muted">Quantidade</Text>
                        <Text className="text-sm font-medium text-foreground">
                          {item.quantity}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <View className="flex-1 gap-1">
                        <Text className="text-xs text-muted">Umidor</Text>
                        <Text className="text-sm font-medium text-foreground">
                          {getHumidorName(item.humidorId)}
                        </Text>
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-xs text-muted">Preço</Text>
                        <Text className="text-sm font-medium text-foreground">
                          R$ {item.purchasePrice.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/new-review",
                        params: { cigarId: item.id },
                      })
                    }
                    className="bg-primary rounded-lg py-2 items-center justify-center active:opacity-80"
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center gap-2">
                      <IconSymbol
                        name="star.fill"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text className="text-white font-medium text-sm">
                        Fumar & Avaliar
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Add Button */}
        <TouchableOpacity
          onPress={() => router.push("/new-cigar")}
          className="bg-primary rounded-xl p-4 items-center justify-center active:opacity-80"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            <IconSymbol
              name="plus.circle.fill"
              size={20}
              color="#FFFFFF"
            />
            <Text className="text-white font-semibold">
              Adicionar Charuto
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
