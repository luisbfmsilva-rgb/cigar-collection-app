import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { Avatar, Icon, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { SuperPost } from '@/lib/types';

/** A Super Post: the one highlighted post a day from a verified influencer or manufacturer. */
export function SuperPostCard({ post: p, mine, onDelete }: { post: SuperPost; mine?: boolean; onDelete?: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <View style={{ width: 300, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accent, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, backgroundColor: colors.surfaceAlt }}>
        <Pressable onPress={() => router.push(`/user/${p.username}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }} accessibilityRole="button">
          <Avatar name={p.display_name} url={p.avatar_url} size={34} seed={p.id} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { fontFamily: fonts.bold }]} numberOfLines={1}>{p.display_name}</Text>
            <Text style={type.caption}>{timeAgo(p.created_at, t)}</Text>
          </View>
        </Pressable>
        <Pill label={p.account_type === 'manufacturer' ? t('super.maker') : t('super.influencer')} tone="accent" />
      </View>
      {p.photo_path ? <Image source={{ uri: publicUrl('checkin-photos', p.photo_path) }} style={{ width: '100%', height: 160 }} contentFit="cover" /> : null}
      <View style={{ padding: space.md, gap: space.sm }}>
        <Row2><Icon name="star" size={14} color={colors.gold} /><Text style={[type.overline, { color: colors.gold }]}>{t('super.title')}</Text></Row2>
        <Text style={type.body} numberOfLines={6}>{p.body}</Text>
        {mine ? (
          <Pressable onPress={() => Alert.alert(t('common.delete'), undefined, [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: onDelete }])}>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('common.delete')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push({ pathname: '/report', params: { kind: 'super_post', id: p.id, userId: p.user_id } })}>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('report.title')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const Row2 = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{children}</View>;
