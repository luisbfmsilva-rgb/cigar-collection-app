import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoPicker } from "@/components/photo-picker";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/context/data-context";
import { useRouter } from "expo-router";
import { useState } from "react";

const VITOLAS = [
  "Robusto",
  "Toro",
  "Churchill",
  "Corona",
  "Panatela",
  "Lancero",
  "Torpedo",
  "Belicoso",
  "Gigante",
  "Petit Corona",
];

const COUNTRIES = [
  "Cuba",
  "República Dominicana",
  "Nicarágua",
  "Honduras",
  "Brasil",
  "Equador",
  "Colômbia",
  "México",
  "Panamá",
];

export default function NewCigarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCigar, humidors } = useData();

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [vitola, setVitola] = useState("Robusto");
  const [ringGauge, setRingGauge] = useState("");
  const [length, setLength] = useState("");
  const [country, setCountry] = useState("República Dominicana");
  const [wrapper, setWrapper] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [humidorId, setHumidorId] = useState(humidors[0]?.id || "");
  const [photoUri, setPhotoUri] = useState("");

  const handleSave = async () => {
    if (!brand || !name || !ringGauge || !length || !purchasePrice || !humidorId) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await addCigar({
        brand,
        name,
        vitola,
        ringGauge: parseInt(ringGauge),
        length: parseFloat(length),
        country,
        wrapper,
        quantity: parseInt(quantity),
        purchaseDate,
        purchasePrice: parseFloat(purchasePrice),
        purchaseLocation,
        humidorId,
        photoUri: photoUri || undefined,
      });

      Alert.alert("Sucesso", "Charuto adicionado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar o charuto");
      console.error(error);
    }
  };

  if (humidors.length === 0) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <IconSymbol
              name="box.fill"
              size={32}
              color={colors.primary}
            />
          </View>
          <View className="items-center gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Nenhum Umidor
            </Text>
            <Text className="text-sm text-muted text-center max-w-xs">
              Você precisa criar um umidor antes de adicionar charutos
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/humidors")}
            className="bg-primary rounded-lg px-6 py-3 mt-4"
          >
            <Text className="text-white font-semibold">
              Ir para Umidores
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 pb-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-foreground">
              Novo Charuto
            </Text>
            <Text className="text-sm text-muted">
              Adicione um charuto à sua coleção
            </Text>
          </View>

          {/* Marca */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Marca *
            </Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="Ex: Cohiba"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Nome/Linha */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Nome/Linha *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Robusto"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Vitola */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Vitola
            </Text>
            <View className="bg-surface border border-border rounded-lg">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 8 }}
              >
                {VITOLAS.map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setVitola(v)}
                    className={`px-4 py-2 rounded-full border ${
                      vitola === v
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        vitola === v ? "text-white" : "text-foreground"
                      }`}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Ring Gauge & Length */}
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-foreground">
                Ring Gauge *
              </Text>
              <TextInput
                value={ringGauge}
                onChangeText={setRingGauge}
                placeholder="Ex: 50"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-foreground">
                Comprimento (mm) *
              </Text>
              <TextInput
                value={length}
                onChangeText={setLength}
                placeholder="Ex: 124"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>
          </View>

          {/* País */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              País de Origem
            </Text>
            <View className="bg-surface border border-border rounded-lg">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 8 }}
              >
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCountry(c)}
                    className={`px-4 py-2 rounded-full border whitespace-nowrap ${
                      country === c
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        country === c ? "text-white" : "text-foreground"
                      }`}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Wrapper */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Capa (Wrapper)
            </Text>
            <TextInput
              value={wrapper}
              onChangeText={setWrapper}
              placeholder="Ex: Connecticut"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Quantidade */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Quantidade
            </Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Data de Compra */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Data de Compra
            </Text>
            <TextInput
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Preço */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Valor Pago (R$) *
            </Text>
            <TextInput
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="Ex: 50.00"
              keyboardType="decimal-pad"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Local de Compra */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Local de Compra
            </Text>
            <TextInput
              value={purchaseLocation}
              onChangeText={setPurchaseLocation}
              placeholder="Ex: Loja XYZ"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* Umidor */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Umidor *
            </Text>
            <View className="bg-surface border border-border rounded-lg">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 8 }}
              >
                {humidors.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setHumidorId(h.id)}
                    className={`px-4 py-2 rounded-full border whitespace-nowrap ${
                      humidorId === h.id
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        humidorId === h.id ? "text-white" : "text-foreground"
                      }`}
                    >
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Foto do Charuto */}
          <PhotoPicker
            onPhotoSelected={setPhotoUri}
            photoUri={photoUri}
            label="Foto do Charuto"
          />

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
                Adicionar Charuto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
