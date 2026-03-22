import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

interface Confraria {
  id: number;
  name: string;
  description: string;
  membersCount: number;
  isPrivate: boolean;
  isMember: boolean;
  createdBy: string;
  icon: string;
}

// Mock data
const MOCK_CONFRARIAS: Confraria[] = [
  {
    id: 1,
    name: "Cohiba Lovers",
    description: "Para os apaixonados por Cohiba",
    membersCount: 342,
    isPrivate: false,
    isMember: true,
    createdBy: "João Silva",
    icon: "🔥",
  },
  {
    id: 2,
    name: "Davidoff Elite",
    description: "Clube exclusivo de Davidoff",
    membersCount: 156,
    isPrivate: true,
    isMember: false,
    createdBy: "Maria Santos",
    icon: "👑",
  },
  {
    id: 3,
    name: "Padron Masters",
    description: "Degustação de Padron 1964",
    membersCount: 89,
    isPrivate: true,
    isMember: true,
    createdBy: "Carlos Costa",
    icon: "⭐",
  },
  {
    id: 4,
    name: "Charutos Brasileiros",
    description: "Celebrando charutos do Brasil",
    membersCount: 234,
    isPrivate: false,
    isMember: false,
    createdBy: "Ana Silva",
    icon: "🇧🇷",
  },
];

export default function ConfrariasScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [confrarias, setConfrarias] = useState<Confraria[]>(MOCK_CONFRARIAS);
  const [searchText, setSearchText] = useState("");
  const [filteredConfrarias, setFilteredConfrarias] = useState<Confraria[]>(MOCK_CONFRARIAS);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const filtered = confrarias.filter((c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.description.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredConfrarias(filtered);
  }, [searchText, confrarias]);

  const handleJoinConfraria = (id: number) => {
    setConfrarias(
      confrarias.map((c) => {
        if (c.id === id) {
          return { ...c, isMember: !c.isMember, membersCount: c.isMember ? c.membersCount - 1 : c.membersCount + 1 };
        }
        return c;
      })
    );
    Alert.alert("Sucesso", "Você entrou na confraria!");
  };

  const handleCreateConfraria = () => {
    Alert.prompt(
      "Criar Confraria",
      "Nome da sua confraria:",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Criar",
          onPress: (name: string | undefined) => {
            if (name?.trim()) {
              Alert.alert("Sucesso", "Confraria criada! Você é o administrador.");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderConfraria = ({ item }: { item: Confraria }) => (
    <Pressable
      className="bg-surface rounded-lg p-4 mb-3 border border-border active:opacity-70"
      onPress={() => Alert.alert("Confraria", `Você abriu: ${item.name}`)}
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary + "20" }}
        >
          <Text style={{ fontSize: 28 }}>{item.icon}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-bold text-foreground flex-1">{item.name}</Text>
            {item.isPrivate && (
              <View className="bg-primary rounded px-2 py-1">
                <Text className="text-white text-xs font-semibold">Privada</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-muted mb-2">{item.description}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted">
              👥 {item.membersCount} membros • Por {item.createdBy}
            </Text>
            <Pressable
              onPress={() => handleJoinConfraria(item.id)}
              className="bg-primary rounded px-3 py-1 active:opacity-80"
            >
              <Text className="text-white text-xs font-semibold">
                {item.isMember ? "Sair" : "Entrar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Header */}
        <View className="gap-2 mb-4">
          <Text className="text-3xl font-bold text-foreground">Confrarias</Text>
          <Text className="text-sm text-muted">Grupos de charutos apaixonados</Text>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Buscar confrarias..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        />

        {/* Confrarias List */}
        <FlatList
          data={filteredConfrarias}
          renderItem={renderConfraria}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={true}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-4">
              <Text style={{ fontSize: 60 }}>🔍</Text>
              <Text className="text-lg font-semibold text-foreground">
                Nenhuma confraria encontrada
              </Text>
              <Text className="text-sm text-muted text-center px-4">
                Crie uma nova confraria ou procure por outras!
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center active:scale-95"
        style={{ backgroundColor: colors.primary }}
        onPress={handleCreateConfraria}
      >
        <Text style={{ fontSize: 24 }}>➕</Text>
      </Pressable>
    </ScreenContainer>
  );
}
