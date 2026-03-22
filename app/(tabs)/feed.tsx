import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

interface FeedPost {
  id: number;
  userId: number;
  userName: string;
  userPhoto?: string;
  content: string;
  imageUrl?: string;
  rating?: number;
  cigarName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

// Mock data - será substituído por dados reais do servidor
const MOCK_FEED_DATA: FeedPost[] = [
  {
    id: 1,
    userId: 1,
    userName: "João Silva",
    userPhoto: "👤",
    content: "Que charuto incrível! Muito bom mesmo.",
    imageUrl: "🔥",
    rating: 9.2,
    cigarName: "Cohiba Robusto",
    likesCount: 42,
    commentsCount: 8,
    isLiked: false,
    createdAt: "2 horas atrás",
  },
  {
    id: 2,
    userId: 2,
    userName: "Maria Santos",
    userPhoto: "👤",
    content: "Davidoff sempre entrega qualidade. Recomendo!",
    imageUrl: "✨",
    rating: 8.5,
    cigarName: "Davidoff Millennium Blend",
    likesCount: 28,
    commentsCount: 5,
    isLiked: false,
    createdAt: "4 horas atrás",
  },
  {
    id: 3,
    userId: 3,
    userName: "Carlos Costa",
    userPhoto: "👤",
    content: "Padron 1964 Anniversary - simplesmente perfeito!",
    imageUrl: "🌟",
    rating: 9.5,
    cigarName: "Padron 1964 Anniversary",
    likesCount: 67,
    commentsCount: 12,
    isLiked: false,
    createdAt: "6 horas atrás",
  },
];

export default function FeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [feedData, setFeedData] = useState<FeedPost[]>(MOCK_FEED_DATA);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular carregamento de dados
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: number) => {
    setFeedData(
      feedData.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: number) => {
    Alert.prompt(
      "Adicionar Comentário",
      "Escreva seu comentário:",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Enviar",
          onPress: (text: string | undefined) => {
            if (text?.trim()) {
              setFeedData(
                feedData.map((post) => {
                  if (post.id === postId) {
                    return {
                      ...post,
                      commentsCount: post.commentsCount + 1,
                    };
                  }
                  return post;
                })
              );
              Alert.alert("Sucesso", "Comentário adicionado!");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleShare = (post: FeedPost) => {
    Alert.alert(
      "Compartilhar",
      `Compartilhando review de ${post.cigarName}`,
      [
        { text: "Cancelar", onPress: () => {} },
        { text: "WhatsApp", onPress: () => {} },
        { text: "Instagram", onPress: () => {} },
        { text: "Copiar Link", onPress: () => {} },
      ]
    );
  };

  const renderPost = ({ item }: { item: FeedPost }) => (
    <View
      className="bg-surface border-b border-border p-4"
      style={{ borderBottomColor: colors.border }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <Text style={{ fontSize: 20 }}>{item.userPhoto}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{item.userName}</Text>
            <Text className="text-xs text-muted">{item.createdAt}</Text>
          </View>
        </View>
        <Pressable className="p-2">
          <Text style={{ fontSize: 18 }}>•••</Text>
        </Pressable>
      </View>

      {/* Cigar Info */}
      <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-semibold text-foreground text-sm">
            {item.cigarName}
          </Text>
          {item.rating && (
            <View className="flex-row items-center gap-1">
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text className="font-semibold text-foreground text-sm">
                {item.rating}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <Text className="text-foreground mb-3 leading-5">{item.content}</Text>

      {/* Image */}
      {item.imageUrl && (
        <View className="mb-3 h-48 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + "10" }}>
          <Text style={{ fontSize: 80 }}>{item.imageUrl}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <Pressable
          className="flex-row items-center gap-2 flex-1 py-2"
          onPress={() => handleLike(item.id)}
        >
          <Text style={{ fontSize: 18 }}>{item.isLiked ? "❤️" : "🤍"}</Text>
          <Text className="text-sm text-muted">{item.likesCount}</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-2 flex-1 py-2"
          onPress={() => handleComment(item.id)}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text className="text-sm text-muted">{item.commentsCount}</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-2 flex-1 py-2"
          onPress={() => handleShare(item)}
        >
          <Text style={{ fontSize: 18 }}>📤</Text>
          <Text className="text-sm text-muted">Compartilhar</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-surface border-b border-border p-4">
          <Text className="text-2xl font-bold text-foreground">Feed Social</Text>
          <Text className="text-sm text-muted mt-1">
            Compartilhe e descubra reviews de charutos
          </Text>
        </View>

        {/* Feed */}
        <FlatList
          data={feedData}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          scrollEnabled={true}
          contentContainerStyle={{ flexGrow: 1 }}
        />

        {/* Empty State */}
        {feedData.length === 0 && (
          <View className="flex-1 items-center justify-center gap-4">
            <Text style={{ fontSize: 60 }}>📭</Text>
            <Text className="text-lg font-semibold text-foreground">
              Nenhum post ainda
            </Text>
            <Text className="text-sm text-muted text-center px-4">
              Comece a compartilhar seus reviews de charutos!
            </Text>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center active:scale-95"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push("/new-review")}
      >
        <Text style={{ fontSize: 24 }}>➕</Text>
      </Pressable>
    </ScreenContainer>
  );
}
