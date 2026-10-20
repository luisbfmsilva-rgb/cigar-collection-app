import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { Avatar, Button, Card, Chip, Empty, Icon, IconButton, Pill, Row, SectionTitle, Segmented } from '@/components/ui';
import { localized, useI18n } from '@/i18n';
import { creatorLinks, deleteCreatorLink, feed, isFollowing, setBlock, setFollow, userBadges, userFlavorProfile } from '@/lib/api';
import { useFlavors } from '@/lib/flavors';
import { countryName } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Profile } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

type Tab = 'checkins' | 'content' | 'badges';

/** Shared by "Me" tab and other users' profiles. */
export function ProfileView({ profile, isMe, onChanged }: { profile: Profile; isMe: boolean; onChanged?: () => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const ref = useFlavors();
  const verified = profile.creator_status === 'verified';
  const [tab, setTab] = useState<Tab>(verified ? 'content' : 'checkins');
  const following = useAsync(() => (isMe ? Promise.resolve(false) : isFollowing(profile.id)), [profile.id, isMe]);
  const checkins = useAsync(() => feed({ kind: 'user', userId: profile.id }), [profile.id]);
  const badges = useAsync(() => userBadges(profile.id), [profile.id]);
  const links = useAsync(() => (verified ? creatorLinks(profile.id) : Promise.resolve([])), [profile.id, verified]);
  const flavorProfile = useAsync(() => userFlavorProfile(profile.id), [profile.id]);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    setBusy(true);
    try {
      await setFollow(profile.id, !following.data);
      following.setData(!following.data);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  function more() {
    Alert.alert(profile.display_name, undefined, [
      { text: t('common.report'), onPress: () => router.push({ pathname: '/report', params: { kind: 'profile', id: profile.id, userId: profile.id } }) },
      {
        text: t('common.block'), style: 'destructive', onPress: () => Alert.alert(t('report.blockConfirm'), undefined, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.block'), style: 'destructive', onPress: async () => { await setBlock(profile.id, true); router.back(); } },
        ]),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  const tabs: { value: Tab; label: string }[] = [
    ...(verified ? [{ value: 'content' as Tab, label: t('profile.content') }] : []),
    { value: 'checkins', label: t('profile.checkins') },
    { value: 'badges', label: t('profile.badges') },
  ];

  return (
    <View style={{ gap: space.md }}>
      <Row gap={space.lg}>
        <Avatar name={profile.display_name} url={publicUrl('avatars', profile.avatar_url)} size={80} seed={profile.id} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <Text style={[type.title, { fontSize: 24, flexShrink: 1 }]} numberOfLines={2} accessibilityRole="header">{profile.display_name}</Text>
            {verified ? <Icon name="checkmark-circle" size={20} color={colors.accent} /> : null}
          </Row>
          <Text style={type.caption}>@{profile.username}{profile.city || profile.country ? ` · ${[profile.city, countryName(profile.country, locale)].filter(Boolean).join(', ')}` : ''}</Text>
          {verified ? <Text style={[type.caption, { color: colors.gold }]}>{profile.creator_headline || t('profile.verified')}</Text> : null}
        </View>
        {!isMe ? <IconButton icon="ellipsis-horizontal" label={t('common.more')} onPress={more} /> : null}
      </Row>

      {profile.bio ? <Text style={type.body}>{profile.bio}</Text> : null}

      <Row gap={0} style={{ justifyContent: 'space-between' }}>
        <Count n={profile.checkin_count} label={t('profile.checkins')} />
        <Count n={profile.unique_cigar_count} label={t('profile.unique')} />
        <Count n={profile.follower_count} label={t('profile.followers')} onPress={() => router.push({ pathname: '/profile/followers', params: { id: profile.id, mode: 'followers' } })} />
        <Count n={profile.following_count} label={t('profile.following')} onPress={() => router.push({ pathname: '/profile/followers', params: { id: profile.id, mode: 'following' } })} />
      </Row>

      {isMe ? (
        <Row>
          <Button label={t('profile.editProfile')} variant="secondary" small style={{ flex: 1 }} onPress={() => router.push('/profile/edit')} />
          <Button label={t('clubs.title')} variant="secondary" small icon="people-outline" style={{ flex: 1 }} onPress={() => router.push('/clubs')} />
          <IconButton icon="settings-outline" label={t('profile.settings')} filled onPress={() => router.push('/settings')} />
        </Row>
      ) : (
        <Button label={following.data ? t('profile.unfollow') : t('profile.follow')} variant={following.data ? 'secondary' : 'primary'} onPress={toggleFollow} loading={busy} />
      )}

      {isMe && profile.creator_status !== 'verified' ? (
        <Card style={{ gap: space.sm }}>
          {profile.creator_status === 'pending' ? <Text style={type.body}>{t('profile.creatorPending')}</Text> : (
            <>
              <Text style={type.label}>{t('profile.becomeCreator')}</Text>
              <Button label={t('profile.applyCreator')} variant="secondary" small onPress={() => router.push('/creator/apply')} />
            </>
          )}
        </Card>
      ) : null}

      {(flavorProfile.data ?? []).length > 0 ? (
        <>
          <SectionTitle title={t('profile.topFlavors')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {flavorProfile.data!.map((f) => {
              const n = ref?.byCode.get(f.note);
              return <Chip key={f.note} small selected color={n ? ref?.familyByCode.get(n.family)?.color : undefined} label={`${n ? localized(n, locale) : f.note} · ${f.n}`} />;
            })}
          </View>
        </>
      ) : null}

      <View style={{ marginTop: space.md }}>
        <Segmented<Tab> value={tab} onChange={setTab} options={tabs} />
      </View>

      {tab === 'content' ? (
        <View style={{ gap: space.sm }}>
          {isMe ? <Button label={t('profile.addContent')} icon="add" variant="secondary" small onPress={() => router.push('/creator/link')} /> : null}
          {(links.data ?? []).map((l) => (
            <Pressable key={l.id} onPress={() => Linking.openURL(l.url)} onLongPress={isMe ? () => Alert.alert(t('common.delete'), l.title, [
              { text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => deleteCreatorLink(l.id).then(links.reload) },
            ]) : undefined} accessibilityRole="link"
              style={{ flexDirection: 'row', gap: space.md, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              {l.thumbnail_url ? <Image source={{ uri: l.thumbnail_url }} style={{ width: 120, height: 68, borderRadius: 8 }} contentFit="cover" /> : (
                <View style={{ width: 120, height: 68, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={l.kind === 'article' ? 'document-text-outline' : l.kind === 'podcast' ? 'mic-outline' : 'play'} size={26} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.label, { fontFamily: fonts.bold }]} numberOfLines={2}>{l.title}</Text>
                <Text style={type.caption}>{t(`creator.kinds.${l.kind}`)}</Text>
                {l.is_sponsored ? <Pill label={t('profile.sponsored')} tone="warning" /> : null}
              </View>
            </Pressable>
          ))}
          {(links.data ?? []).length === 0 && !links.loading ? <Empty text={t('common.empty')} /> : null}
        </View>
      ) : null}

      {tab === 'checkins' ? (
        <View style={{ gap: space.md }}>
          {(checkins.data ?? []).map((r) => <CheckinCard key={r.id} row={r} onChanged={checkins.reload} />)}
          {(checkins.data ?? []).length === 0 && !checkins.loading ? <Empty text={t('common.empty')} /> : null}
        </View>
      ) : null}

      {tab === 'badges' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(badges.data ?? []).map(({ badge, earned_at }) => (
            <Card key={badge.code} style={{ width: '48%', alignItems: 'center', gap: 6, padding: space.md }}>
              <Icon name={(badge.icon as never) ?? 'ribbon'} size={30} color={colors.accent} />
              <Text style={[type.label, { textAlign: 'center' }]}>{localized(badge, locale)}</Text>
              <Text style={[type.caption, { textAlign: 'center' }]}>{locale === 'pt' ? badge.description_pt : locale === 'es' ? badge.description_es : badge.description_en}</Text>
              <Text style={[type.caption, { fontSize: 11 }]}>{new Date(earned_at).toLocaleDateString()}</Text>
            </Card>
          ))}
          {(badges.data ?? []).length === 0 && !badges.loading ? <Empty text={t('profile.noBadges')} icon="ribbon-outline" /> : null}
        </View>
      ) : null}
    </View>
  );
}

function Count({ n, label, onPress }: { n: number; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={{ alignItems: 'center', minWidth: 70, minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>{n}</Text>
      <Text style={type.caption}>{label}</Text>
    </Pressable>
  );
}
