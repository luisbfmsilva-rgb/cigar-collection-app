import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { PersonRow } from '@/components/PersonRow';
import {
  Avatar, Button, Card, Empty, ErrorText, Field, Icon, IconButton, Loading, Pill, Row, Screen, Segmented, Stars,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  acceptInvite, ClubPostRow, clubMembers, clubPosts, clubRanking, deleteClubPost, getCheckin, getClub, joinClub, leaveClub,
  postToClub, setPinned, setToast, updateMember,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatRating, timeAgo } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

type Tab = 'feed' | 'ranking' | 'members';

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const router = useRouter();
  const { profile } = useAuth();
  const club = useAsync(() => getClub(id), [id]);
  const [tab, setTab] = useState<Tab>('feed');
  const membership = club.data?.membership;
  const active = membership?.status === 'active';
  const canSee = club.data?.club?.privacy === 'public' || active;
  const mod = active && (membership?.role === 'owner' || membership?.role === 'moderator');
  const posts = useAsync(() => (canSee ? clubPosts(id) : Promise.resolve([])), [id, canSee]);
  const ranking = useAsync(() => (canSee ? clubRanking(id) : Promise.resolve([])), [id, canSee]);
  const members = useAsync(() => (canSee ? clubMembers(id) : Promise.resolve([])), [id, canSee]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (club.loading && !club.data) return <Loading />;
  const c = club.data?.club;
  if (!c) return <Screen><ErrorText message={club.error ?? t('common.error')} /></Screen>;

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      club.reload();
      members.reload();
      posts.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const top = (ranking.data ?? [])[0];
  const pending = (members.data ?? []).filter((m) => m.status === 'requested');

  return (
    <Screen keyboard>
      <Stack.Screen options={{ title: c.name }} />
      <View style={{ gap: space.md }}>
        <Row gap={space.lg}>
          {c.avatar_url ? <Image source={{ uri: publicUrl('club-images', c.avatar_url) }} style={{ width: 72, height: 72, borderRadius: 18 }} /> : (
            <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.onAccent }}>{c.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.title, { fontSize: 24 }]} accessibilityRole="header">{c.name}</Text>
            <Text style={type.caption}>{[t('clubs.members', { count: c.member_count }), c.city].filter(Boolean).join(' · ')}</Text>
            {c.privacy === 'private' ? <Pill label={t('clubs.privateShort')} /> : null}
          </View>
        </Row>
        {c.description ? <Text style={type.body}>{c.description}</Text> : null}

        {membership?.status === 'invited' ? (
          <Card style={{ gap: space.sm }}>
            <Text style={type.body}>{t('clubs.pendingInvite')}</Text>
            <Button label={t('clubs.acceptInvite')} onPress={() => act(() => acceptInvite(id))} loading={busy} />
          </Card>
        ) : !membership ? (
          <Button label={c.privacy === 'public' ? t('clubs.join') : t('clubs.requestJoin')} onPress={() => act(() => joinClub(c))} loading={busy} />
        ) : membership.status === 'requested' ? (
          <Button label={t('clubs.requested')} variant="secondary" disabled />
        ) : (
          <Row>
            <Button label={t('clubs.invite')} icon="person-add-outline" variant="secondary" small style={{ flex: 1 }} onPress={() => router.push({ pathname: '/clubs/invite', params: { id } })} />
            {membership.role !== 'owner' ? (
              <Button label={t('clubs.leave')} variant="ghost" small onPress={() => Alert.alert(t('clubs.leave'), c.name, [
                { text: t('common.cancel'), style: 'cancel' }, { text: t('clubs.leave'), style: 'destructive', onPress: () => act(() => leaveClub(id)) },
              ])} />
            ) : null}
          </Row>
        )}
        <ErrorText message={error} />

        {!canSee ? <Empty text={t('clubs.privateLocked')} icon="lock-closed-outline" /> : (
          <>
            {top ? (
              <Card onPress={() => router.push(`/cigar/${top.cigar_id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong }}>
                <Icon name="star" size={26} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={type.overline}>{t('clubs.cigarOfMonth')}</Text>
                  <Text style={[type.label, { fontFamily: fonts.bold, fontSize: 15 }]}>{top.title}</Text>
                  <Text style={type.caption}>{t('clubs.clubAvg', { avg: formatRating(top.avg, locale), count: top.count })}</Text>
                </View>
              </Card>
            ) : null}

            <Segmented<Tab> value={tab} onChange={setTab} options={[
              { value: 'feed', label: t('clubs.feed') }, { value: 'ranking', label: t('clubs.ranking') },
              { value: 'members', label: `${t('clubs.membersTab')}${pending.length && mod ? ` (${pending.length})` : ''}` },
            ]} />

            {tab === 'feed' ? (
              <View style={{ gap: space.md }}>
                {active ? (
                  <Row style={{ alignItems: 'flex-end' }}>
                    <Field value={body} onChangeText={setBody} placeholder={t('clubs.postPlaceholder')} multiline maxLength={2000} style={{ flex: 1 }} />
                    <IconButton icon="send" label={t('clubs.post')} color={colors.accent} filled onPress={() => body.trim() && act(async () => { await postToClub(id, body); setBody(''); })} />
                  </Row>
                ) : null}
                {(posts.data ?? []).map((p) => (
                  <ClubPost key={p.id} post={p} canModerate={!!mod} isMine={p.user_id === profile?.id} onChanged={posts.reload} />
                ))}
                {(posts.data ?? []).length === 0 && !posts.loading ? <Empty text={t('clubs.empty')} /> : null}
              </View>
            ) : null}

            {tab === 'ranking' ? (
              <View style={{ gap: space.sm }}>
                {(ranking.data ?? []).map((r, i) => (
                  <Card key={r.cigar_id} onPress={() => router.push(`/cigar/${r.cigar_id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: i < 3 ? colors.accent : colors.textMuted, width: 28 }}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.label, { fontFamily: fonts.bold }]} numberOfLines={1}>{r.title}</Text>
                      <Row gap={6}><Stars value={r.avg} size={12} /><Text style={type.caption}>{formatRating(r.avg, locale)} · {r.count}</Text></Row>
                    </View>
                  </Card>
                ))}
                {(ranking.data ?? []).length === 0 && !ranking.loading ? <Empty text={t('common.empty')} /> : null}
              </View>
            ) : null}

            {tab === 'members' ? (
              <View>
                {(members.data ?? []).filter((m) => m.status !== 'requested' || mod).map((m) => (
                  <PersonRow key={m.user_id} p={m.profile} onPress={() => router.push(`/user/${m.profile.username}`)} right={
                    m.status === 'requested' && mod ? (
                      <Row gap={4}>
                        <Button label={t('clubs.approve')} small onPress={() => act(() => updateMember(id, m.user_id, { status: 'active' }))} />
                        <IconButton icon="close" label={t('clubs.decline')} onPress={() => act(() => leaveClub(id, m.user_id))} />
                      </Row>
                    ) : m.status === 'invited' ? <Pill label={t('clubs.invited')} /> : (
                      <Pressable disabled={!mod || m.role === 'owner' || m.user_id === profile?.id} onPress={() => Alert.alert(m.profile.display_name, undefined, [
                        m.role === 'member'
                          ? { text: t('clubs.makeMod'), onPress: () => act(() => updateMember(id, m.user_id, { role: 'moderator' })) }
                          : { text: t('clubs.removeMod'), onPress: () => act(() => updateMember(id, m.user_id, { role: 'member' })) },
                        { text: t('clubs.removeMember'), style: 'destructive', onPress: () => act(() => leaveClub(id, m.user_id)) },
                        { text: t('common.cancel'), style: 'cancel' },
                      ])} style={{ minHeight: 44, justifyContent: 'center' }}>
                        <Pill label={t(`clubs.roles.${m.role}`)} tone={m.role === 'owner' ? 'accent' : 'neutral'} />
                      </Pressable>
                    )
                  } />
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function ClubPost({ post, canModerate, isMine, onChanged }: { post: ClubPostRow; canModerate: boolean; isMine: boolean; onChanged: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const checkin = useAsync(() => (post.checkin_id ? getCheckin(post.checkin_id) : Promise.resolve(null)), [post.checkin_id]);
  const [toasted, setToasted] = useState(false);
  const [count, setCount] = useState(post.toast_count);

  if (post.checkin_id) {
    if (!checkin.data) return null;
    return <CheckinCard row={checkin.data} compact onChanged={onChanged} />;
  }

  function more() {
    const opts: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];
    if (canModerate) opts.push({ text: post.pinned ? t('clubs.unpin') : t('clubs.pin'), onPress: () => setPinned(post.id, !post.pinned).then(onChanged) });
    if (canModerate || isMine) opts.push({ text: t('common.delete'), style: 'destructive', onPress: () => deleteClubPost(post.id).then(onChanged) });
    if (!isMine) opts.push({ text: t('common.report'), onPress: () => router.push({ pathname: '/report', params: { kind: 'club_post', id: post.id, userId: post.user_id } }) });
    opts.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert('', undefined, opts);
  }

  return (
    <Card style={{ gap: space.sm }}>
      <Row>
        <Avatar name={post.author.display_name} url={publicUrl('avatars', post.author.avatar_url)} size={36} seed={post.user_id} />
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { fontFamily: fonts.bold }]}>{post.author.display_name}</Text>
          <Text style={type.caption}>{timeAgo(post.created_at, t)}{post.pinned ? ` · ${t('clubs.pinned')}` : ''}</Text>
        </View>
        <IconButton icon="ellipsis-horizontal" label={t('common.more')} color={colors.textMuted} onPress={more} />
      </Row>
      <Text style={type.body}>{post.body}</Text>
      <Pressable accessibilityRole="button" onPress={async () => {
        const next = !toasted;
        setToasted(next);
        setCount((n) => n + (next ? 1 : -1));
        await setToast('club_post', post.id, next).catch(() => {});
      }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
        <Icon name={toasted ? 'flame' : 'flame-outline'} size={18} color={toasted ? colors.accent : colors.textMuted} />
        <Text style={{ color: toasted ? colors.accent : colors.textMuted, fontFamily: fonts.semibold }}>{t('feed.toast')}{count ? ` · ${count}` : ''}</Text>
      </Pressable>
    </Card>
  );
}
