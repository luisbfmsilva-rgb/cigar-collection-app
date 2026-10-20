import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { Icon, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Club } from '@/lib/types';

export function ClubRow({ club, badge, onPress }: { club: Club; badge?: string; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}>
      {club.avatar_url ? <Image source={{ uri: publicUrl('club-images', club.avatar_url) }} style={{ width: 52, height: 52, borderRadius: 14 }} /> : (
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.onAccent }}>{club.name.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.label, { fontFamily: fonts.bold, fontSize: 15 }]} numberOfLines={1}>{club.name}</Text>
        <Text style={type.caption} numberOfLines={1}>{[t('clubs.members', { count: club.member_count }), club.city].filter(Boolean).join(' · ')}</Text>
      </View>
      {badge ? <Pill label={badge} /> : club.privacy === 'private' ? <Icon name="lock-closed-outline" size={16} color={colors.textMuted} /> : null}
    </Pressable>
  );
}
