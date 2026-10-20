import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { CheckinCard } from '@/components/CheckinCard';
import { Avatar, Bar, Card, Chip, ErrorText, Field, IconButton, Loading, Row, Screen, SectionTitle } from '@/components/ui';
import { localized, useI18n } from '@/i18n';
import { addComment, checkinFlavors, comments, deleteComment, getCheckin } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SCORE_MAX } from '@/lib/checkinDraft';
import { useFlavors } from '@/lib/flavors';
import { timeAgo } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

const CRITERIA = ['appearance', 'draw', 'burn', 'flavor', 'aroma', 'overall'] as const;

export default function CheckinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const router = useRouter();
  const { profile } = useAuth();
  const ref = useFlavors();
  const row = useAsync(() => getCheckin(id), [id]);
  const picks = useAsync(() => checkinFlavors(id), [id]);
  const thread = useAsync(() => comments('checkin', id), [id]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (row.loading && !row.data) return <Loading />;
  const c = row.data;
  if (!c) return <Screen><ErrorText message={row.error ?? t('common.error')} /></Screen>;

  const thirds = t.list('review.thirds');
  const byThird = [1, 2, 3, 0].map((n) => ({ n, notes: (picks.data ?? []).filter((p) => p.third === n) })).filter((x) => x.notes.length);
  const scores = { appearance: c.score_appearance, draw: c.score_draw, burn: c.score_burn, flavor: c.score_flavor, aroma: c.score_aroma, overall: c.score_overall };

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await addComment('checkin', id, body);
      setBody('');
      thread.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <CheckinCard row={c} onChanged={() => router.back()} />

        {byThird.length > 0 ? (
          <Card style={{ gap: space.md }}>
            <Text style={type.heading}>{t('checkinDetail.flavors')}</Text>
            {byThird.map(({ n, notes }) => (
              <View key={n} style={{ gap: 6 }}>
                <Text style={type.caption}>{thirds[n]}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {notes.map((p) => {
                    const note = ref?.byCode.get(p.note);
                    return <Chip key={p.note} small selected color={note ? ref?.familyByCode.get(note.family)?.color : undefined} label={`${note ? localized(note, locale) : p.note} ${'•'.repeat(p.intensity)}`} />;
                  })}
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {c.score100 != null ? (
          <Card style={{ gap: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={type.heading}>{t('review.scores')}</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.accent }}>{c.score100}</Text>
            </Row>
            {CRITERIA.map((k) => (
              <Row key={k} gap={space.md}>
                <Text style={[type.caption, { width: 150, color: colors.text }]}>{t(`review.criteria.${k}`)}</Text>
                <Bar value={scores[k] ?? 0} max={SCORE_MAX[k]} />
                <Text style={[type.caption, { width: 42, textAlign: 'right' }]}>{scores[k]}/{SCORE_MAX[k]}</Text>
              </Row>
            ))}
            {c.strength || c.body || c.duration_min ? (
              <Text style={type.caption}>
                {[c.strength ? `${t('review.strength')}: ${t.list('review.levels')[c.strength - 1]}` : null,
                  c.body ? `${t('review.body')}: ${t.list('review.levels')[c.body - 1]}` : null,
                  c.duration_min ? `${c.duration_min} min` : null].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <SectionTitle title={`${t('checkinDetail.comments')}${(thread.data ?? []).length ? ` · ${thread.data!.length}` : ''}`} />
        {(thread.data ?? []).map((cm) => {
          const canDelete = cm.user_id === profile?.id || c.user_id === profile?.id;
          return (
            <Row key={cm.id} style={{ alignItems: 'flex-start' }}>
              <Pressable onPress={() => router.push(`/user/${cm.author.username}`)}>
                <Avatar name={cm.author.display_name} url={publicUrl('avatars', cm.author.avatar_url)} size={32} seed={cm.user_id} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={type.caption}><Text style={{ fontFamily: fonts.bold, color: colors.text }}>{cm.author.display_name}</Text> · {timeAgo(cm.created_at, t)}</Text>
                <Text style={type.body}>{cm.body}</Text>
              </View>
              {canDelete ? (
                <IconButton icon="trash-outline" label={t('common.delete')} size={18} color={colors.textMuted}
                  onPress={() => Alert.alert(t('common.delete'), undefined, [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => deleteComment(cm.id).then(thread.reload) }])} />
              ) : (
                <IconButton icon="flag-outline" label={t('common.report')} size={18} color={colors.textMuted}
                  onPress={() => router.push({ pathname: '/report', params: { kind: 'comment', id: cm.id, userId: cm.user_id } })} />
              )}
            </Row>
          );
        })}
        <Row style={{ alignItems: 'flex-end' }}>
          <Field value={body} onChangeText={setBody} placeholder={t('checkinDetail.addComment')} multiline maxLength={1000} style={{ flex: 1 }} />
          <IconButton icon="send" label={t('checkinDetail.send')} color={colors.accent} onPress={send} filled />
        </Row>
        {sending ? <Text style={type.caption}>{t('common.loading')}</Text> : null}
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
