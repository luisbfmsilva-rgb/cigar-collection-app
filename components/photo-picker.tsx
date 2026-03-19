import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

interface PhotoPickerProps {
  onPhotoSelected: (uri: string) => void;
  photoUri?: string;
  label?: string;
}

export function PhotoPicker({
  onPhotoSelected,
  photoUri,
  label = "Adicionar Foto",
}: PhotoPickerProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    setIsLoading(true);
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de acesso à sua galeria para adicionar fotos."
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      Alert.alert("Erro", "Falha ao selecionar a foto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsLoading(true);
    try {
      // Solicitar permissão de câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Precisamos de acesso à câmera para tirar fotos."
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Falha ao tirar a foto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover a foto?",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Remover",
          onPress: () => onPhotoSelected(""),
          style: "destructive",
        },
      ]
    );
  };

  if (photoUri) {
    return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <View className="relative">
          <Image
            source={{ uri: photoUri }}
            className="w-full h-48 rounded-lg bg-surface"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={handleRemovePhoto}
            className="absolute top-2 right-2 bg-error rounded-full p-2 active:opacity-80"
            activeOpacity={0.8}
          >
            <IconSymbol name="xmark" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickImage}
            className="absolute bottom-2 right-2 bg-primary rounded-full p-2 active:opacity-80"
            activeOpacity={0.8}
          >
            <IconSymbol name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={isLoading}
          className={`flex-1 border-2 border-dashed border-border rounded-lg p-4 items-center justify-center gap-2 active:opacity-80 ${
            isLoading ? "opacity-50" : ""
          }`}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <IconSymbol
                name="photo.fill"
                size={24}
                color={colors.primary}
              />
              <Text className="text-sm font-medium text-foreground">
                Galeria
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTakePhoto}
          disabled={isLoading}
          className={`flex-1 border-2 border-dashed border-border rounded-lg p-4 items-center justify-center gap-2 active:opacity-80 ${
            isLoading ? "opacity-50" : ""
          }`}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <IconSymbol
                name="camera.fill"
                size={24}
                color={colors.primary}
              />
              <Text className="text-sm font-medium text-foreground">
                Câmera
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
