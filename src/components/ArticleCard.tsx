import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { BrandArticle } from '@/lib/types';

/** Article published by a manufacturer (brand page and the "From the makers" strip in the feed). */
export function ArticleCard({ article: a, onPress, showBrand }: { article: BrandArticle; onPress: () => void; showBrand?: boolean }) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}>
      {a.cover_path ? <Image source={{ uri: publicUrl('cigar-images', a.cover_path) }} style={{ width: '100%', height: 150 }} contentFit="cover" /> : null}
      <View style={{ padding: space.md, gap: 4 }}>
        {showBrand && a.brand ? <Text style={[type.overline, { color: colors.gold }]}>{a.brand.name} · {t('brand.official')}</Text> : null}
        <Text style={[type.label, { fontFamily: fonts.bold, fontSize: 16 }]} numberOfLines={2}>{a.title}</Text>
        <Text style={type.caption} numberOfLines={2}>{a.body}</Text>
        <Text style={[type.caption, { fontSize: 11 }]}>{timeAgo(a.created_at, t)}</Text>
      </View>
    </Pressable>
  );
}
