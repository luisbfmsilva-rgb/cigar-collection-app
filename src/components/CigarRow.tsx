import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { Icon, Stars } from '@/components/ui';
import { useI18n } from '@/i18n';
import { cigarTitle, countryName, formatRating, formatSize } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Cigar } from '@/lib/types';

export function CigarThumb({ url, size = 52 }: { url?: string | null; size?: number }) {
  if (url) {
    return <Image source={{ uri: publicUrl('cigar-images', url) }} style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.chip }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.8, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#7A4E2C' }} />
      <View style={{ position: 'absolute', width: size * 0.15, height: size * 0.26, backgroundColor: colors.accent, borderRadius: 2, right: size * 0.28 }} />
    </View>
  );
}

export function CigarRow({ cigar, onPress, right }: { cigar: Cigar; onPress: () => void; right?: React.ReactNode }) {
  const { locale } = useI18n();
  const size = formatSize(cigar.ring_gauge, cigar.length_in);
  return (
    <Pressable
      onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1,
      })}
    >
      <CigarThumb url={cigar.image_url} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.label, { fontFamily: fonts.bold, fontSize: 15 }]} numberOfLines={1}>{cigarTitle(cigar)}</Text>
        <Text style={type.caption} numberOfLines={1}>
          {[cigar.vitola, size, countryName(cigar.country, locale)].filter(Boolean).join(' · ')}
        </Text>
        {cigar.rating_count > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Stars value={cigar.avg_rating} size={12} />
            <Text style={type.caption}>{formatRating(cigar.avg_rating, locale)} ({cigar.rating_count})</Text>
          </View>
        ) : null}
      </View>
      {right ?? <Icon name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}
