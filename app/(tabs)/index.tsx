import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const colors = useColors();
  const { humidors, cigars, reviews } = useData();
  const router = useRouter();

  // Calculate cigars smoked this month
  const thisMonth = new Date();
  const currentMonth = thisMonth.getMonth();
  const currentYear = thisMonth.getFullYear();
  
  const cigarsThisMonth = reviews.filter((r) => {
    const reviewDate = new Date(r.tastingDate);
    return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
  }).length;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-4xl font-bold text-foreground">
              Bem-vindo
            </Text>
            <Text className="text-base text-muted">
              Gerencie sua coleção de charutos
            </Text>
          </View>

          {/* Stats Cards */}
          <View className="gap-3">
            {/* Total de Charutos */}
            <TouchableOpacity
              onPress={() => router.push("/inventory")}
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-sm text-muted font-medium">
                    Total de Charutos
                  </Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {cigars.length}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol
                    name="square.stack.fill"
                    size={24}
                    color={colors.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Total de Umidores */}
            <TouchableOpacity
              onPress={() => router.push("/humidors")}
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-sm text-muted font-medium">
                    Umidores
                  </Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {humidors.length}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol
                    name="box.fill"
                    size={24}
                    color={colors.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Charutos Fumados */}
            <TouchableOpacity
              onPress={() => router.push("/reviews")}
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-sm text-muted font-medium">
                    Fumados Este Mês
                  </Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {cigarsThisMonth}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <IconSymbol
                    name="star.fill"
                    size={24}
                    color={colors.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Cigars Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Charutos Recentes
            </Text>
            {cigars.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center justify-center py-12">
                <Text className="text-muted text-center">
                  Nenhum charuto adicionado ainda
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {cigars.slice(-3).map((cigar) => (
                  <TouchableOpacity
                    key={cigar.id}
                    className="bg-surface rounded-xl p-3 border border-border w-40"
                  >
                    <Text className="font-semibold text-foreground text-sm">
                      {cigar.brand}
                    </Text>
                    <Text className="text-xs text-muted">
                      {cigar.vitola}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Qtd: {cigar.quantity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Export Button */}
          <TouchableOpacity
            onPress={() => router.push("/export-report")}
            className="bg-primary rounded-xl p-4 flex-row items-center justify-between active:opacity-80"
            activeOpacity={0.8}
          >
            <View className="gap-1">
              <Text className="text-sm font-semibold text-white">
                Exportar Relatório
              </Text>
              <Text className="text-xs text-white/80">
                Gere um PDF da sua coleção
              </Text>
            </View>
            <IconSymbol
              name="doc.fill"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Recent Reviews Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Últimos Reviews
            </Text>
            {reviews.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center justify-center py-12">
                <Text className="text-muted text-center">
                  Nenhum review criado ainda
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {reviews.slice(-3).map((review) => (
                  <TouchableOpacity
                    key={review.id}
                    className="bg-surface rounded-xl p-3 border border-border w-40"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-foreground text-sm">
                        {review.finalScore}/100
                      </Text>
                      <IconSymbol
                        name="star.fill"
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <Text className="text-xs text-muted">
                      {new Date(review.tastingDate).toLocaleDateString("pt-BR")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push("/inventory")}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: colors.primary }}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="plus.circle.fill"
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
