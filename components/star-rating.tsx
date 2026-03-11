import { View, TouchableOpacity, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface StarRatingProps {
  rating: number; // 1-5
  onRatingChange: (rating: number) => void;
  label: string;
  description?: string;
  descriptions?: Record<number, string>;
}

export function StarRating({
  rating,
  onRatingChange,
  label,
  description,
  descriptions,
}: StarRatingProps) {
  const colors = useColors();

  const getDescription = (star: number) => {
    if (descriptions) {
      return descriptions[star];
    }
    return description;
  };

  return (
    <View className="gap-3 bg-surface rounded-xl p-4 border border-border">
      <View className="gap-1">
        <Text className="font-semibold text-foreground">{label}</Text>
        {rating > 0 && getDescription(rating) && (
          <Text className="text-xs text-muted">{getDescription(rating)}</Text>
        )}
      </View>

      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="star.fill"
              size={32}
              color={star <= rating ? colors.primary : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
