import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  const handleLogin = async () => {
    // OAuth login será acionado pela navegação para /oauth/callback
    router.push("/oauth/callback");
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center gap-8">
          {/* Logo Section */}
          <View className="items-center gap-4">
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <Text style={{ fontSize: 60 }}>🔥</Text>
            </View>
            <View className="items-center gap-2">
              <Text className="text-4xl font-bold text-foreground">
                Cigar Collection
              </Text>
              <Text className="text-base text-muted text-center">
                Gerencie sua coleção de charutos
              </Text>
            </View>
          </View>

          {/* Features Section */}
          <View className="gap-3">
            <View className="flex-row gap-3 items-start">
              <Text style={{ fontSize: 24 }}>📦</Text>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground">
                  Organize Seus Charutos
                </Text>
                <Text className="text-sm text-muted">
                  Cadastre umidores e charutos com detalhes completos
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 items-start">
              <Text style={{ fontSize: 24 }}>⭐</Text>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground">
                  Avalie Seus Charutos
                </Text>
                <Text className="text-sm text-muted">
                  Sistema profissional de reviews com 5 critérios
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 items-start">
              <Text style={{ fontSize: 24 }}>📊</Text>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground">
                  Acompanhe Estatísticas
                </Text>
                <Text className="text-sm text-muted">
                  Gráficos e análises da sua coleção
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 items-start">
              <Text style={{ fontSize: 24 }}>👥</Text>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground">
                  Compartilhe Reviews
                </Text>
                <Text className="text-sm text-muted">
                  Publique reviews e conecte com outros aficionados
                </Text>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            className="bg-primary rounded-xl py-4 items-center justify-center active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 20 }}>🔐</Text>
            <Text className="text-white font-semibold text-base">
              Fazer Login
            </Text>
            </View>
          </Pressable>

          {/* Footer */}
          <View className="items-center gap-2">
            <Text className="text-xs text-muted text-center">
              Ao fazer login, você concorda com nossos{"\n"}
              Termos de Serviço e Política de Privacidade
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
