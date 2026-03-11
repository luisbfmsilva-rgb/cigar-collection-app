import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";
import { useState } from "react";

const HUMIDOR_TYPES = [
  { label: "Caixa", value: "box" },
  { label: "Umidor", value: "humidor" },
  { label: "Gaveta", value: "drawer" },
  { label: "Outro", value: "other" },
];

export default function NewHumidorScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addHumidor } = useData();

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [type, setType] = useState<"box" | "humidor" | "drawer" | "other">("box");

  const handleSave = async () => {
    if (!name || !capacity) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      await addHumidor({
        name,
        capacity: parseInt(capacity),
        type,
      });

      Alert.alert("Sucesso", "Umidor adicionado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar o umidor");
      console.error(error);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6 pb-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-foreground">
              Novo Umidor
            </Text>
            <Text className="text-sm text-muted">
              Adicione um local para armazenar seus charutos
            </Text>
          </View>

          {/* Info Card */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-2">
            <View className="flex-row items-start gap-3">
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={colors.primary}
              />
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  Dica
                </Text>
                <Text className="text-xs text-muted">
                  Um umidor é qualquer local onde você armazena seus charutos (caixa, gaveta, armário, etc.)
                </Text>
              </View>
            </View>
          </View>

          {/* Nome */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Nome do Umidor *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Umidor da Sala, Gaveta do Quarto"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Capacidade */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Capacidade (quantidade de charutos) *
            </Text>
            <TextInput
              value={capacity}
              onChangeText={setCapacity}
              placeholder="Ex: 50"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Tipo */}
          <View className="gap-3">
            <Text className="text-sm font-medium text-foreground">
              Tipo de Umidor
            </Text>
            <View className="gap-2">
              {HUMIDOR_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value as typeof type)}
                  className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                    type === t.value
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      type === t.value
                        ? "border-white bg-primary"
                        : "border-border"
                    }`}
                  >
                    {type === t.value && (
                      <View className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </View>
                  <Text
                    className={`font-medium ${
                      type === t.value ? "text-white" : "text-foreground"
                    }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 border border-border rounded-lg py-3 items-center justify-center active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-foreground">
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-white">
                Criar Umidor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
