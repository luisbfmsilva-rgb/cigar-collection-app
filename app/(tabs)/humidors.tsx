import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";

export default function HumidorsScreen() {
  const colors = useColors();
  const { humidors, deleteHumidor } = useData();
  const router = useRouter();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Deletar Umidor",
      `Tem certeza que deseja deletar "${name}"? Todos os charutos neste umidor também serão removidos.`,
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Deletar",
          onPress: async () => {
            try {
              await deleteHumidor(id);
              Alert.alert("Sucesso", "Umidor deletado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao deletar o umidor");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">
            Umidores
          </Text>
          <Text className="text-sm text-muted">
            {humidors.length} umidor{humidors.length !== 1 ? "es" : ""}
          </Text>
        </View>

        {/* List or Empty State */}
        {humidors.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <IconSymbol
                name="box.fill"
                size={32}
                color={colors.primary}
              />
            </View>
            <View className="items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">
                Nenhum Umidor
              </Text>
              <Text className="text-sm text-muted text-center max-w-xs">
                Comece adicionando um umidor ou caixa para armazenar seus charutos
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={humidors}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => {
              const capacityPercent = (item.cigarsCount / item.capacity) * 100;
              return (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-1">
                        <Text className="font-semibold text-foreground text-lg">
                          {item.name}
                        </Text>
                        <Text className="text-xs text-muted capitalize">
                          {item.type === "box"
                            ? "Caixa"
                            : item.type === "humidor"
                            ? "Umidor"
                            : item.type === "drawer"
                            ? "Gaveta"
                            : "Outro"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.name)}
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

                    {/* Capacity Info */}
                    <View className="gap-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-medium text-foreground">
                          Capacidade
                        </Text>
                        <Text className="text-sm text-muted">
                          {item.cigarsCount}/{item.capacity}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View className="h-2 bg-border rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: colors.primary,
                            width: `${Math.min(capacityPercent, 100)}%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Add Button */}
        <TouchableOpacity
          onPress={() => router.push("/new-humidor")}
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
              Adicionar Umidor
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
