import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { CigarThumb } from '@/components/CigarRow';
import { Bar, Button, Card, Chip, Empty, ErrorText, Icon, Loading, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { localized, useI18n } from '@/i18n';
import { cigarStats, creatorLinksForCigar, feed, getCigar, setWishlist, wishlistHas } from '@/lib/api';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { useFlavors } from '@/lib/flavors';
import { countryName, formatRating, formatSize } from '@/lib/format';
import { colors, fonts, space, type } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

export default function CigarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale, s } = useI18n();
  const router = useRouter();
  const { reset } = useCheckinDraft();
  const flavors = useFlavors();
  const cigar = useAsync(() => getCigar(id), [id]);
  const stats = useAsync(() => cigarStats(id), [id]);
  const recent = useAsync(() => feed({ kind: 'cigar', cigarId: id }), [id]);
  const videos = useAsync(() => creatorLinksForCigar(id), [id]);
  const wish = useAsync(() => wishlistHas(id), [id]);
  const [wishBusy, setWishBusy] = useState(false);

  if (cigar.loading && !cigar.data) return <Loading />;
  const c = cigar.data;
  if (!c) return <Screen><ErrorText message={cigar.error ?? t('common.error')} /></Screen>;

  const maxMentions = Math.max(1, ...(stats.data?.flavors ?? []).map((f) => Number(f.mentions)));
  const friends = stats.data?.friends;

  async function toggleWish() {
    setWishBusy(true);
    try {
      await setWishlist(id, !wish.data);
      wish.setData(!wish.data);
    } finally {
      setWishBusy(false);
    }
  }

  const specs: [string, string | null][] = [
    [t('cigar.wrapper'), [c.wrapper, c.wrapper_shade].filter(Boolean).join(' · ') || null],
    [t('cigar.binder'), c.binder],
    [t('cigar.filler'), c.filler],
    [t('cigar.size'), [c.vitola, formatSize(c.ring_gauge, c.length_in)].filter(Boolean).join(' · ') || null],
    [t('cigar.country'), countryName(c.country, locale)],
    [t('cigar.strength'), c.strength ? s.cigar.strengths[c.strength] : null],
  ];

  return (
    <Screen
      footer={
        <>
          <Button label={t('cigar.addHumidor')} variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/humidor/add', params: { cigarId: id } })} />
          <Button label={t('cigar.checkin')} style={{ flex: 1.4 }} onPress={() => { reset({ cigar: c }); router.push('/checkin/new'); }} />
        </>
      }
    >
      <Stack.Screen options={{ title: c.brand_name }} />
      <View style={{ gap: space.md }}>
        <Row gap={space.lg}>
          <CigarThumb url={c.image_url} size={88} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.overline}>{[c.brand_name, countryName(c.country, locale)].filter(Boolean).join(' · ')}</Text>
            <Text style={[type.display, { fontSize: 26, lineHeight: 30 }]} accessibilityRole="header">{c.line}</Text>
            {c.status !== 'regular' ? <Pill label={s.cigar.status[c.status]} tone="warning" /> : null}
          </View>
        </Row>

        {!c.approved ? <Card style={{ backgroundColor: colors.warning, borderColor: colors.warning }}><Text style={[type.body, { color: colors.onWarning }]}>{t('cigar.pending')}</Text></Card> : null}

        <Row gap={space.sm}>
          <Stat value={formatRating(c.avg_rating, locale)} label={`${t('cigar.community')} (${c.rating_count})`} accent />
          <Stat value={friends?.avg_rating != null ? formatRating(friends.avg_rating, locale) : '–'} label={t('cigar.friends')} />
          <Stat value={c.avg_score100 != null ? String(Math.round(Number(c.avg_score100))) : '–'} label={t('cigar.score100')} />
        </Row>

        <Button
          label={wish.data ? t('cigar.onWishlist') : t('cigar.wishlist')} icon={wish.data ? 'heart' : 'heart-outline'}
          variant="ghost" small onPress={toggleWish} loading={wishBusy} style={{ alignSelf: 'flex-start' }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md }}>
          {specs.filter(([, v]) => v).map(([label, value]) => (
            <View key={label} style={{ width: '50%', paddingRight: space.md }}>
              <Text style={type.caption}>{label}</Text>
              <Text style={[type.label, { fontFamily: fonts.semibold }]}>{value}</Text>
            </View>
          ))}
        </View>

        {(stats.data?.flavors ?? []).length > 0 ? (
          <>
            <SectionTitle title={t('cigar.topFlavors')} />
            <View style={{ gap: 8 }}>
              {stats.data!.flavors.slice(0, 6).map((f) => {
                const note = flavors?.byCode.get(f.note);
                const fam = flavors?.familyByCode.get(f.family);
                return (
                  <Row key={f.note} gap={space.md}>
                    <Text style={[type.caption, { width: 110, color: colors.text }]} numberOfLines={1}>{note ? localized(note, locale) : f.note}</Text>
                    <Bar value={Number(f.mentions)} max={maxMentions} color={fam?.color ?? colors.accent} />
                  </Row>
                );
              })}
            </View>
          </>
        ) : null}

        {(stats.data?.pairings ?? []).length > 0 ? (
          <>
            <SectionTitle title={t('cigar.topPairings')} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {stats.data!.pairings.map((p) => <Chip key={`${p.kind}-${p.name}`} label={`${p.name} · ${p.mentions}`} />)}
            </View>
          </>
        ) : null}

        {(videos.data ?? []).length > 0 ? (
          <>
            <SectionTitle title={t('cigar.creatorReviews')} />
            <View style={{ gap: space.sm }}>
              {videos.data!.map((v) => (
                <Pressable key={v.id} onPress={() => Linking.openURL(v.url)} accessibilityRole="link"
                  style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: space.sm, borderWidth: 1, borderColor: colors.border }}>
                  {v.thumbnail_url ? <Image source={{ uri: v.thumbnail_url }} style={{ width: 96, height: 54, borderRadius: 8 }} /> : (
                    <View style={{ width: 96, height: 54, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}><Icon name="play" /></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={type.label} numberOfLines={2}>{v.title}</Text>
                    <Text style={type.caption}>@{v.author.username}{v.is_sponsored ? ` · ${t('profile.sponsored')}` : ''}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle title={t('cigar.recentCheckins')} />
        {(recent.data ?? []).length === 0 && !recent.loading ? <Empty text={t('cigar.noRatings')} icon="star-outline" /> : null}
        <View style={{ gap: space.md }}>
          {(recent.data ?? []).slice(0, 10).map((r) => <CheckinCard key={r.id} row={r} compact onChanged={recent.reload} />)}
        </View>
      </View>
    </Screen>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', padding: space.md }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: accent ? colors.accent : colors.text }}>{value}</Text>
      <Text style={[type.caption, { textAlign: 'center' }]} numberOfLines={2}>{label}</Text>
    </Card>
  );
}
