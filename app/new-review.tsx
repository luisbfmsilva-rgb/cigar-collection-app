import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoPicker } from "@/components/photo-picker";
import { useColors } from "@/hooks/use-colors";
import { StarRating } from "@/components/star-rating";
import { TagSelector } from "@/components/tag-selector";
import { useData } from "@/lib/context/data-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";

const DESCRIPTIONS = {
  preLight: {
    1: "Aparência feia",
    2: "Não muito atraente",
    3: "Parece ok",
    4: "Bonito e com bom gosto",
    5: "Mal pode esperar para começar",
  },
  smoke: {
    1: "Decepcionante",
    2: "Não muito empolgante",
    3: "Parece bom, mas falta sabor",
    4: "Bom sabor e textura",
    5: "Encantador e ricamente aromático",
  },
  flavour: {
    1: "Amargo, áspero ou geralmente desagradável",
    2: "Sem graça e inofensivo",
    3: "Diferentes sabores notados, mas nada se destaca",
    4: "Sabores claramente definidos aparecem",
    5: "Uma jornada de sabores bem equilibrada e matizada",
  },
  burn: {
    1: "Bagunçada, desigual e pouco confiável",
    2: "Um pouco bagunçada, com cinza quebradiça",
    3: "Um pouco desigual, mas gerenciável",
    4: "Queima uniforme e cinza limpa",
    5: "Perfeitamente uniforme com cinza impecavelmente formada",
  },
  enjoyment: {
    1: "Decepcionado, provavelmente não fumaria novamente",
    2: "Uma experiência abaixo das expectativas",
    3: "Bom, mas nada especial",
    4: "Muito agradável e fumaria novamente",
    5: "Impressionante, um item obrigatório!",
  },
};

export default function NewReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cigarId } = useLocalSearchParams();
  const { addReview, cigars } = useData();

  const [preLight, setPreLight] = useState(0);
  const [smoke, setSmoke] = useState(0);
  const [flavour, setFlavour] = useState(0);
  const [burn, setBurn] = useState(0);
  const [enjoyment, setEnjoyment] = useState(0);
  const [flavorsIdentified, setFlavorsIdentified] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<"suave" | "médio" | "forte">("médio");
  const [comments, setComments] = useState("");
  const [tastingDate, setTastingDate] = useState(new Date().toISOString().split("T")[0]);
  const [smokingTime, setSmokingTime] = useState("");
  const [photoUri, setPhotoUri] = useState("");

  const cigar = cigars.find((c) => c.id === cigarId);

  const handleSave = async () => {
    if (!cigarId) {
      Alert.alert("Erro", "Charuto não encontrado");
      return;
    }

    if (preLight === 0 || smoke === 0 || flavour === 0 || burn === 0 || enjoyment === 0) {
      Alert.alert("Erro", "Por favor, avalie todos os critérios");
      return;
    }

    try {
      await addReview({
        cigarId: cigarId as string,
        tastingDate,
        preLight,
        smoke,
        flavour,
        burn,
        enjoyment,
        flavorsIdentified,
        intensity,
        comments,
        smokingTime: smokingTime ? parseInt(smokingTime) : undefined,
        photoUri: photoUri || undefined,
      });

      Alert.alert("Sucesso", "Review salvo com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar o review");
      console.error(error);
    }
  };

  const finalScore = preLight && smoke && flavour && burn && enjoyment
    ? Math.round(((preLight + smoke + flavour + burn + enjoyment) / 5) * 20)
    : 0;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6 pb-6">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-foreground">
              Novo Review
            </Text>
            {cigar && (
              <Text className="text-sm text-muted">
                {cigar.brand} - {cigar.vitola}
              </Text>
            )}
          </View>

          {/* Basic Info */}
          <View className="gap-3 bg-surface rounded-xl p-4 border border-border">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Data da Degustação
              </Text>
              <TextInput
                value={tastingDate}
                onChangeText={setTastingDate}
                placeholder="YYYY-MM-DD"
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Tempo de Fumaça (minutos)
              </Text>
              <TextInput
                value={smokingTime}
                onChangeText={setSmokingTime}
                placeholder="Ex: 45"
                keyboardType="numeric"
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              />
            </View>
          </View>

          {/* Star Ratings */}
          <StarRating
            rating={preLight}
            onRatingChange={setPreLight}
            label="Pré-Acendimento (Pre-Light)"
            descriptions={DESCRIPTIONS.preLight as any}
          />

          <StarRating
            rating={smoke}
            onRatingChange={setSmoke}
            label="Fumaça (Smoke)"
            descriptions={DESCRIPTIONS.smoke as any}
          />

          <StarRating
            rating={flavour}
            onRatingChange={setFlavour}
            label="Sabor (Flavour)"
            descriptions={DESCRIPTIONS.flavour as any}
          />

          <StarRating
            rating={burn}
            onRatingChange={setBurn}
            label="Queima (Burn)"
            descriptions={DESCRIPTIONS.burn as any}
          />

          <StarRating
            rating={enjoyment}
            onRatingChange={setEnjoyment}
            label="Prazer/Aproveitamento (Enjoyment)"
            descriptions={DESCRIPTIONS.enjoyment as any}
          />

          {/* Flavors */}
          <TagSelector
            selectedTags={flavorsIdentified}
            onTagsChange={setFlavorsIdentified}
          />

          {/* Intensity */}
          <View className="gap-3 bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground">
              Intensidade Geral
            </Text>
            <View className="flex-row gap-2">
              {(["suave", "médio", "forte"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setIntensity(level)}
                  className={`flex-1 rounded-lg py-2 items-center justify-center border ${
                    intensity === level
                      ? "border-primary bg-primary"
                      : "border-border bg-background"
                  }`}
                >
                  <Text
                    className={`font-medium capitalize ${
                      intensity === level
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comments */}
          <View className="gap-2 bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground">
              Comentários
            </Text>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Adicione suas notas e impressões..."
              multiline
              numberOfLines={4}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              textAlignVertical="top"
            />
          </View>

          {/* Final Score */}
          {finalScore > 0 && (
            <View className="gap-2 bg-primary rounded-xl p-4 items-center justify-center">
              <Text className="text-white text-sm font-medium">
                Pontuação Final
              </Text>
              <Text className="text-white text-4xl font-bold">
                {finalScore}
              </Text>
              <Text className="text-white text-xs">
                de 100 pontos
              </Text>
            </View>
          )}

          {/* Foto do Review */}
          <PhotoPicker
            onPhotoSelected={setPhotoUri}
            photoUri={photoUri}
            label="Foto do Charuto Fumado"
          />

          {/* Action Buttons */}
          <View className="flex-row gap-3">
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
              disabled={finalScore === 0}
              className="flex-1 bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
              style={{ opacity: finalScore === 0 ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-white">
                Salvar Review
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
