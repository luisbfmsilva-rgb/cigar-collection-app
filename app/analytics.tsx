import { ScrollView, View, Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useData } from "@/lib/context/data-context";
import { analyticsService } from "@/lib/services/analytics-service";
import { useMemo } from "react";
import { useColors } from "@/hooks/use-colors";

export default function AnalyticsScreen() {
  const colors = useColors();
  const { cigars, reviews } = useData();

  const analytics = useMemo(
    () => analyticsService.calculateAnalytics(cigars, reviews),
    [cigars, reviews]
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Título */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Estatísticas
            </Text>
            <Text className="text-sm text-muted">
              Análise da sua coleção de charutos
            </Text>
          </View>

          {/* Resumo Geral */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Resumo Geral
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Total de Charutos</Text>
                <Text className="text-2xl font-bold text-primary">
                  {analytics.totalCigars}
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Total de Reviews</Text>
                <Text className="text-2xl font-bold text-primary">
                  {analytics.totalReviews}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Nota Média</Text>
                <Text className="text-2xl font-bold text-primary">
                  {analytics.averageRating.toFixed(1)}/100
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Tempo Médio</Text>
                <Text className="text-2xl font-bold text-primary">
                  {analytics.averageSmokingTime}m
                </Text>
              </View>
            </View>
          </View>

          {/* Top Marcas */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Top Marcas
            </Text>

            {analytics.topBrands.length > 0 ? (
              analytics.topBrands.slice(0, 5).map((brand, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-surface rounded-lg p-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {brand.brand}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="bg-primary rounded-full"
                      style={{
                        width: `${Math.min(brand.count * 10, 100)}%`,
                        height: 6,
                      }}
                    />
                    <Text className="text-xs text-muted w-8 text-right">
                      {brand.count}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-sm text-muted text-center py-4">
                Nenhuma marca cadastrada
              </Text>
            )}
          </View>

          {/* Top Sabores */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Sabores Favoritos
            </Text>

            {analytics.topFlavors.length > 0 ? (
              analytics.topFlavors.slice(0, 5).map((flavor, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-surface rounded-lg p-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {flavor.flavor}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="bg-primary rounded-full"
                      style={{
                        width: `${Math.min(flavor.count * 15, 100)}%`,
                        height: 6,
                      }}
                    />
                    <Text className="text-xs text-muted w-8 text-right">
                      {flavor.count}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-sm text-muted text-center py-4">
                Nenhum sabor identificado
              </Text>
            )}
          </View>

          {/* Top Vitolas */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Vitolas Preferidas
            </Text>

            {analytics.topVitolas.length > 0 ? (
              analytics.topVitolas.slice(0, 5).map((vitola, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-surface rounded-lg p-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {vitola.vitola}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="bg-primary rounded-full"
                      style={{
                        width: `${Math.min(vitola.count * 10, 100)}%`,
                        height: 6,
                      }}
                    />
                    <Text className="text-xs text-muted w-8 text-right">
                      {vitola.count}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-sm text-muted text-center py-4">
                Nenhuma vitola cadastrada
              </Text>
            )}
          </View>

          {/* Tendência de Notas */}
          {analytics.ratingTrend.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">
                Evolução de Notas
              </Text>

              {analytics.ratingTrend.slice(-6).map((trend, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-surface rounded-lg p-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {trend.month}
                  </Text>
                  <Text className="text-sm font-bold text-primary">
                    {trend.averageRating.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Tendência de Fumadas */}
          {analytics.smokingTrend.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">
                Fumadas por Mês
              </Text>

              {analytics.smokingTrend.slice(-6).map((trend, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-surface rounded-lg p-3"
                >
                  <Text className="text-sm font-medium text-foreground">
                    {trend.month}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="bg-primary rounded-full"
                      style={{
                        width: `${Math.min(trend.count * 20, 100)}%`,
                        height: 6,
                      }}
                    />
                    <Text className="text-xs text-muted w-6 text-right">
                      {trend.count}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
