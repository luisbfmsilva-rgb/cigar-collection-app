import { ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { generateCollectionPDF, shareCollectionReport, type CollectionStats } from "@/lib/pdf-generator";

export default function ExportReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cigars, reviews, humidors } = useData();
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateStats = (): CollectionStats => {
    // Calcular charutos fumados
    const cigarIds = new Set(reviews.map((r) => r.cigarId));
    const cigarsSmoked = cigarIds.size;

    // Calcular avaliação média
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.finalScore, 0) / reviews.length
        : 0;

    // Top rated cigars
    const cigarRatings: { [key: string]: { scores: number[]; cigar: any } } = {};
    reviews.forEach((r) => {
      const cigar = cigars.find((c) => c.id === r.cigarId);
      if (cigar) {
        if (!cigarRatings[r.cigarId]) {
          cigarRatings[r.cigarId] = { scores: [], cigar };
        }
        cigarRatings[r.cigarId].scores.push(r.finalScore);
      }
    });

    const topRatedCigars = Object.values(cigarRatings)
      .map((item) => ({
        ...item.cigar,
        avgRating: item.scores.reduce((a, b) => a + b, 0) / item.scores.length,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // Recent reviews
    const recentReviews = [...reviews].sort(
      (a, b) => new Date(b.tastingDate).getTime() - new Date(a.tastingDate).getTime()
    );

    return {
      totalCigars: cigars.length,
      totalHumidors: humidors.length,
      totalReviews: reviews.length,
      averageRating: avgRating,
      cigarsSmoked,
      topRatedCigars,
      recentReviews,
    };
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const stats = calculateStats();
      const filePath = await generateCollectionPDF(humidors, cigars, reviews, stats);

      Alert.alert("Sucesso", "Relatório gerado com sucesso!", [
        {
          text: "Compartilhar",
          onPress: async () => {
            try {
              await shareCollectionReport(filePath);
            } catch (error) {
              Alert.alert("Erro", "Falha ao compartilhar o relatório");
            }
          },
        },
        {
          text: "Fechar",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar o relatório");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = calculateStats();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="active:opacity-80"
                activeOpacity={0.8}
              >
                <IconSymbol name="chevron.left" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground flex-1">
                Exportar Relatório
              </Text>
            </View>
            <Text className="text-sm text-muted">
              Gere um relatório completo da sua coleção
            </Text>
          </View>

          {/* Stats Preview */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">
              Resumo da Coleção
            </Text>

            <View className="bg-surface rounded-xl p-4 border border-border gap-3">
              <View className="flex-row justify-between items-center">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Total de Charutos</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.totalCigars}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol name="leaf.fill" size={24} color={colors.primary} />
                </View>
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row justify-between items-center">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Total de Umidores</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.totalHumidors}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol name="cube.box.fill" size={24} color={colors.primary} />
                </View>
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row justify-between items-center">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Charutos Fumados</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.cigarsSmoked}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol name="flame.fill" size={24} color={colors.primary} />
                </View>
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row justify-between items-center">
                <View className="gap-1">
                  <Text className="text-xs text-muted">Avaliação Média</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol name="star.fill" size={24} color={colors.primary} />
                </View>
              </View>
            </View>
          </View>

          {/* Report Details */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground uppercase">
              Conteúdo do Relatório
            </Text>

            <View className="gap-2">
              <View className="flex-row items-start gap-3 bg-surface rounded-lg p-3 border border-border">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground">Resumo da Coleção</Text>
                  <Text className="text-xs text-muted">
                    Estatísticas gerais e métricas principais
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3 bg-surface rounded-lg p-3 border border-border">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground">Lista de Umidores</Text>
                  <Text className="text-xs text-muted">
                    Detalhes de cada umidor e capacidade
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3 bg-surface rounded-lg p-3 border border-border">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground">Charutos Melhor Avaliados</Text>
                  <Text className="text-xs text-muted">
                    Top 5 charutos com maiores pontuações
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3 bg-surface rounded-lg p-3 border border-border">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="font-medium text-foreground">Reviews Recentes</Text>
                  <Text className="text-xs text-muted">
                    Últimos 10 reviews com datas e pontuações
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Generate Button */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleGenerateReport}
              disabled={isGenerating}
              className={`rounded-lg py-3 items-center justify-center active:opacity-80 ${
                isGenerating ? "opacity-50" : "bg-primary"
              }`}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="font-semibold text-white">
                    Gerando Relatório...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
                  <Text className="font-semibold text-white">
                    Gerar Relatório
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-lg py-3 items-center justify-center border border-border active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-foreground">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="bg-primary/10 rounded-lg p-4 gap-2">
            <View className="flex-row items-start gap-2">
              <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-xs font-medium text-foreground">
                  Dica
                </Text>
                <Text className="text-xs text-muted mt-1">
                  O relatório será gerado em formato HTML e poderá ser compartilhado via email, mensagens ou salvo no seu dispositivo.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
