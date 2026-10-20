import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Avatar, Card, Chip, Icon, IconName, Pill, Row, Stars } from '@/components/ui';
import { localized, useI18n } from '@/i18n';
import { deleteCheckin, setSaved, setToast } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cigarTitle, formatRating, timeAgo } from '@/lib/format';
import { useFlavors } from '@/lib/flavors';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, space, TOUCH, type } from '@/lib/theme';
import type { CheckinFeedRow, PairingKind } from '@/lib/types';

const PAIRING_ICON: Record<PairingKind, IconName> = {
  spirit: 'wine-outline', wine: 'wine', beer: 'beer-outline', coffee: 'cafe-outline',
  non_alcoholic: 'water-outline', food: 'restaurant-outline', other: 'ellipsis-horizontal',
};

export function CheckinCard({ row, onChanged, compact }: { row: CheckinFeedRow; onChanged?: () => void; compact?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { profile } = useAuth();
  const flavors = useFlavors();
  const [toasted, setToasted] = useState(row.toasted_by_me);
  const [toasts, setToasts] = useState(row.toast_count);
  const [saved, setSavedState] = useState(row.saved_by_me);
  const mine = profile?.id === row.user_id;

  const where = row.at_home ? t('feed.athome') : row.venue_name ? `${t('feed.at')} ${row.venue_name}${row.venue_city ? `, ${row.venue_city}` : ''}` : null;

  async function toggleToast() {
    const next = !toasted;
    setToasted(next);
    setToasts((n) => n + (next ? 1 : -1));
    try {
      await setToast('checkin', row.id, next);
    } catch {
      setToasted(!next);
      setToasts((n) => n + (next ? -1 : 1));
    }
  }

  async function toggleSave() {
    const next = !saved;
    setSavedState(next);
    try {
      await setSaved(row.id, next);
    } catch {
      setSavedState(!next);
    }
  }

  function share() {
    const title = cigarTitle({ brand_name: row.brand_name, line: row.cigar_line });
    const notes = row.flavor_notes.slice(0, 4).map((c) => (flavors?.byCode.get(c) ? localized(flavors.byCode.get(c)!, locale) : c)).join(', ');
    const msg = t('share.checkin', { name: row.display_name, cigar: title, rating: formatRating(row.rating, locale) }) + (notes ? ` · ${notes}` : '');
    Share.share({ message: `${msg}\n${t('share.footer')}` });
  }

  function more() {
    const buttons = mine
      ? [{
        text: t('common.delete'), style: 'destructive' as const, onPress: () => Alert.alert(t('checkinDetail.deleteConfirm'), undefined, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteCheckin(row.id); onChanged?.(); } },
        ]),
      }]
      : [{ text: t('common.report'), onPress: () => router.push({ pathname: '/report', params: { kind: 'checkin', id: row.id, userId: row.user_id } }) }];
    Alert.alert(cigarTitle({ brand_name: row.brand_name, line: row.cigar_line }), undefined, [...buttons, { text: t('common.cancel'), style: 'cancel' }]);
  }

  return (
    <Card style={{ gap: space.md, padding: space.lg }}>
      <Row>
        <Pressable onPress={() => router.push(`/user/${row.username}`)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
          <Avatar name={row.display_name} url={publicUrl('avatars', row.avatar_url)} seed={row.user_id} />
          <View style={{ flex: 1 }}>
            <Row gap={4}>
              <Text style={[type.label, { fontFamily: fonts.bold }]} numberOfLines={1}>{row.display_name}</Text>
              {row.creator_status === 'verified' ? <Icon name="checkmark-circle" size={15} color={colors.accent} /> : null}
              <Text style={[type.caption, { color: colors.textMuted }]}>{t('feed.checkedIn')}</Text>
            </Row>
            <Text style={type.caption} numberOfLines={1}>
              {timeAgo(row.created_at, t)}{where ? ` · ${where}` : ''}{row.event_title ? ` · ${row.event_title}` : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={more} accessibilityRole="button" accessibilityLabel={t('common.more')} hitSlop={8} style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="ellipsis-horizontal" color={colors.textMuted} />
        </Pressable>
      </Row>

      <Pressable onPress={() => router.push(`/cigar/${row.cigar_id}`)} accessibilityRole="link">
        <Text style={[type.title, { fontSize: 20 }]}>{cigarTitle({ brand_name: row.brand_name, line: row.cigar_line })}</Text>
        <Text style={type.caption}>{[row.cigar_vitola, row.wrapper_shade].filter(Boolean).join(' · ')}</Text>
      </Pressable>

      <Row>
        <Stars value={row.rating} />
        <Text style={[type.label, { fontFamily: fonts.bold }]}>{formatRating(row.rating, locale)}</Text>
        {row.score100 != null ? <Pill label={t('checkinDetail.score', { score: row.score100 })} tone="neutral" /> : null}
      </Row>

      {row.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {row.photos.map((p) => (
            <Pressable key={p.path} onPress={() => router.push(`/checkin/${row.id}`)}>
              <Image
                source={{ uri: publicUrl('checkin-photos', p.path) }}
                style={{ width: row.photos.length === 1 ? 300 : 180, height: row.photos.length === 1 ? 220 : 180, borderRadius: 12, backgroundColor: colors.chip }}
                contentFit="cover" accessibilityLabel={t('checkin.photos')}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {row.note && !compact ? <Text style={type.body} numberOfLines={6}>{row.note}</Text> : null}

      {row.flavor_notes.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {row.flavor_notes.slice(0, 6).map((code) => {
            const n = flavors?.byCode.get(code);
            return <Chip key={code} small label={n ? localized(n, locale) : code} />;
          })}
        </View>
      ) : null}

      {(row.pairings.length > 0 || row.music_title) && !compact ? (
        <View style={{ gap: 6 }}>
          {row.pairings.map((p, i) => (
            <Row key={i} gap={8}>
              <Icon name={PAIRING_ICON[p.kind] ?? 'wine-outline'} size={16} color={colors.accent} />
              <Text style={type.caption}>{p.name}</Text>
            </Row>
          ))}
          {row.music_title ? (
            <Pressable onPress={() => row.music_url && Linking.openURL(row.music_url)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {row.music_artwork_url ? <Image source={{ uri: row.music_artwork_url }} style={{ width: 28, height: 28, borderRadius: 4 }} /> : <Icon name="musical-notes-outline" size={16} color={colors.accent} />}
              <Text style={type.caption} numberOfLines={1}>{[row.music_title, row.music_artist].filter(Boolean).join(' · ')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Row style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.xs, justifyContent: 'space-between' }}>
        <Action icon={toasted ? 'flame' : 'flame-outline'} label={`${t('feed.toast')}${toasts ? ` · ${toasts}` : ''}`} active={toasted} onPress={toggleToast} />
        <Action icon="chatbubble-outline" label={`${t('feed.comment')}${row.comment_count ? ` · ${row.comment_count}` : ''}`} onPress={() => router.push(`/checkin/${row.id}`)} />
        <Action icon="share-outline" label={t('common.share')} onPress={share} iconOnly />
        <Action icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? t('feed.saved') : t('feed.save')} active={saved} onPress={toggleSave} iconOnly />
      </Row>
    </Card>
  );
}

function Action({ icon, label, onPress, active, iconOnly }: { icon: IconName; label: string; onPress: () => void; active?: boolean; iconOnly?: boolean }) {
  const color = active ? colors.accent : colors.textMuted;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }}
      style={{ minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 }}>
      <Icon name={icon} size={19} color={color} />
      {iconOnly ? null : <Text style={{ color, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>}
    </Pressable>
  );
}
