import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useState } from "react";

export default function ReviewsScreen() {
  const colors = useColors();
  const { reviews, cigars, deleteReview } = useData();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Deletar Review",
      "Tem certeza que deseja deletar este review?",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Deletar",
          onPress: async () => {
            try {
              await deleteReview(id);
              Alert.alert("Sucesso", "Review deletado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao deletar o review");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getCigarInfo = (cigarId: string) => {
    return cigars.find((c) => c.id === cigarId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22C55E"; // Verde - Excelente
    if (score >= 80) return "#F59E0B"; // Amarelo - Muito Bom
    if (score >= 70) return "#3B82F6"; // Azul - Bom
    if (score >= 60) return "#8B5CF6"; // Roxo - Aceitável
    return "#EF4444"; // Vermelho - Ruim
  };

  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.tastingDate).getTime() - new Date(a.tastingDate).getTime()
  );

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">
            Reviews
          </Text>
          <Text className="text-sm text-muted">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* List or Empty State */}
        {sortedReviews.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <IconSymbol
                name="star.fill"
                size={32}
                color={colors.primary}
              />
            </View>
            <View className="items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">
                Nenhum Review
              </Text>
              <Text className="text-sm text-muted text-center max-w-xs">
                Crie seu primeiro review ao fumar um charuto
              </Text>
            </View>

            {/* Info Card */}
            <View className="bg-surface rounded-xl p-4 border border-border gap-2 w-full mt-4">
              <View className="flex-row items-start gap-3">
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={colors.primary}
                />
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-foreground text-sm">
                    Sistema Pandora's Cigar Box
                  </Text>
                  <Text className="text-xs text-muted">
                    Avalie seus charutos com 5 critérios profissionais: Pré-Acendimento, Fumaça, Sabor, Queima e Prazer
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={sortedReviews}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => {
              const cigar = getCigarInfo(item.cigarId);
              const scoreColor = getScoreColor(item.finalScore);

              return (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-1">
                        <Text className="font-semibold text-foreground text-lg">
                          {cigar?.brand || "Charuto Desconhecido"}
                        </Text>
                        <Text className="text-sm text-muted">
                          {cigar?.vitola || ""}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
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

                    {/* Score */}
                    <View
                      className="rounded-lg p-3 items-center justify-center"
                      style={{ backgroundColor: scoreColor + "20" }}
                    >
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: scoreColor }}
                      >
                        {item.finalScore}
                      </Text>
                      <Text className="text-xs text-muted">
                        Pontuação Final
                      </Text>
                    </View>

                    {/* Criteria Grid */}
                    <View className="gap-2">
                      <View className="flex-row gap-2">
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Pré-Luz</Text>
                          <Text className="text-lg font-bold text-foreground">
                            {item.preLight}
                          </Text>
                        </View>
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Fumaça</Text>
                          <Text className="text-lg font-bold text-foreground">
                            {item.smoke}
                          </Text>
                        </View>
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Sabor</Text>
                          <Text className="text-lg font-bold text-foreground">
                            {item.flavour}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Queima</Text>
                          <Text className="text-lg font-bold text-foreground">
                            {item.burn}
                          </Text>
                        </View>
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Prazer</Text>
                          <Text className="text-lg font-bold text-foreground">
                            {item.enjoyment}
                          </Text>
                        </View>
                        <View className="flex-1 items-center gap-1 bg-background rounded-lg p-2">
                          <Text className="text-xs text-muted">Intensidade</Text>
                          <Text className="text-xs font-bold text-foreground capitalize">
                            {item.intensity[0].toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Flavors */}
                    {item.flavorsIdentified.length > 0 && (
                      <View className="gap-2">
                        <Text className="text-xs text-muted">Sabores</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {item.flavorsIdentified.slice(0, 3).map((flavor) => (
                            <View
                              key={flavor}
                              className="bg-primary rounded-full px-2 py-1"
                            >
                              <Text className="text-xs text-white font-medium">
                                {flavor}
                              </Text>
                            </View>
                          ))}
                          {item.flavorsIdentified.length > 3 && (
                            <View className="bg-border rounded-full px-2 py-1">
                              <Text className="text-xs text-muted font-medium">
                                +{item.flavorsIdentified.length - 3}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Date */}
                    <Text className="text-xs text-muted">
                      {new Date(item.tastingDate).toLocaleDateString("pt-BR")}
                      {item.smokingTime && ` • ${item.smokingTime} min`}
                    </Text>
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
