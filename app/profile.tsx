import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [favoriteMarks, setFavoriteMarks] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading]);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao selecionar foto");
      console.error(error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Integrar com API para salvar perfil no Supabase
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar perfil");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Sair",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Erro", "Falha ao fazer logout");
            console.error(error);
          }
        },
        style: "destructive",
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg text-foreground">Não autenticado</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Perfil</Text>
            <Text className="text-sm text-muted">Gerencie suas informações</Text>
          </View>

          {/* Profile Photo */}
          <View className="items-center gap-4">
            <Pressable
              onPress={handlePickPhoto}
              className="relative"
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center border-2"
                style={{ borderColor: colors.primary }}
              >
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text style={{ fontSize: 48 }}>📷</Text>
                )}
              </View>
              <View
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </View>
            </Pressable>
            <View className="items-center gap-1">
              <Text className="text-lg font-semibold text-foreground">
                {user.name || "Usuário"}
              </Text>
              <Text className="text-sm text-muted">{user.email}</Text>
            </View>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Bio */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Bio</Text>
              <TextInput
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor={colors.muted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
                style={{ textAlignVertical: "top" }}
              />
            </View>

            {/* Age */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Idade</Text>
              <TextInput
                placeholder="Sua idade"
                placeholderTextColor={colors.muted}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* City */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Cidade</Text>
              <TextInput
                placeholder="Sua cidade"
                placeholderTextColor={colors.muted}
                value={city}
                onChangeText={setCity}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Country */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">País</Text>
              <TextInput
                placeholder="Seu país"
                placeholderTextColor={colors.muted}
                value={country}
                onChangeText={setCountry}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            {/* Favorite Brands */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Marcas Favoritas
              </Text>
              <TextInput
                placeholder="Ex: Cohiba, Davidoff, Padron (separadas por vírgula)"
                placeholderTextColor={colors.muted}
                value={favoriteMarks}
                onChangeText={setFavoriteMarks}
                multiline
                numberOfLines={2}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
                style={{ textAlignVertical: "top" }}
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSaveProfile}
            disabled={isSaving}
            className="bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
            style={{ opacity: isSaving ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold text-base">
              {isSaving ? "Salvando..." : "Salvar Perfil"}
            </Text>
          </Pressable>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            className="bg-error rounded-lg py-3 items-center justify-center active:opacity-80"
            style={{ backgroundColor: colors.error }}
          >
            <Text className="text-white font-semibold text-base">Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
