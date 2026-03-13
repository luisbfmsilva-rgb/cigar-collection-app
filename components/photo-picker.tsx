import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão Necessária",
        "Precisamos de acesso à sua galeria para adicionar fotos."
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao selecionar a foto");
      console.error(error);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão Necessária",
        "Precisamos de acesso à câmera para tirar fotos."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao tirar a foto");
      console.error(error);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoSelected("");
  };

  if (photoUri) {
    return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <View className="relative">
          <Image
            source={{ uri: photoUri }}
            className="w-full h-48 rounded-lg bg-surface"
          />
          <TouchableOpacity
            onPress={handleRemovePhoto}
            className="absolute top-2 right-2 bg-error rounded-full p-2 active:opacity-80"
            activeOpacity={0.8}
          >
            <IconSymbol name="xmark" size={16} color="#FFFFFF" />
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
          className="flex-1 border-2 border-dashed border-border rounded-lg p-4 items-center justify-center gap-2 active:opacity-80"
          activeOpacity={0.8}
        >
          <IconSymbol
            name="photo.fill"
            size={24}
            color={colors.primary}
          />
          <Text className="text-sm font-medium text-foreground">
            Galeria
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTakePhoto}
          className="flex-1 border-2 border-dashed border-border rounded-lg p-4 items-center justify-center gap-2 active:opacity-80"
          activeOpacity={0.8}
        >
          <IconSymbol
            name="camera.fill"
            size={24}
            color={colors.primary}
          />
          <Text className="text-sm font-medium text-foreground">
            Câmera
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
