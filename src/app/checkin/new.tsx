import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, ErrorText, Field, Icon, IconName, Pill, RatingInput, Row, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createCheckin, humidorItemsForCigar, myClubs, updateCheckin } from '@/lib/api';
import { minutesBetween, reviewTotal, useCheckinDraft } from '@/lib/checkinDraft';
import { cigarTitle, scoreToRating } from '@/lib/format';
import { colors, fonts, radius, space, TOUCH, type } from '@/lib/theme';
import type { Visibility } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

export default function NewCheckin() {
  const { t } = useI18n();
  const router = useRouter();
  const { draft, update, reset } = useCheckinDraft();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clubs = useAsync(() => myClubs().then((r) => r.filter((m) => m.status === 'active')), []);
  const fromHumidor = useAsync(() => (draft.cigar ? humidorItemsForCigar(draft.cigar.id) : Promise.resolve([])), [draft.cigar?.id]);

  if (!draft.cigar) {
    return (
      <Screen>
        <Button label={t('checkin.pickCigar')} onPress={() => router.replace('/checkin/pick-cigar')} />
      </Screen>
    );
  }

  const total = reviewTotal(draft.scores);
  const running = draft.startedAt != null && draft.endedAt == null;

  function lightUp() {
    update({ startedAt: Date.now(), endedAt: null });
  }
  function putOut() {
    const end = Date.now();
    update({ endedAt: end, duration: minutesBetween(draft.startedAt ?? end, end) });
  }
  function discard() {
    Alert.alert(t('checkin.discardTitle'), t('checkin.discardBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('checkin.discard'), style: 'destructive', onPress: () => { reset(); router.dismissAll(); } },
    ]);
  }

  function addPhoto() {
    if (draft.photos.length + draft.keptPhotos >= 5) return;
    const fromCamera = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled) update({ photos: [...draft.photos, ...res.assets.map((a) => ({ uri: a.uri, mime: a.mimeType ?? 'image/jpeg' }))].slice(0, 5) });
    };
    const fromLibrary = async () => {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 5 - draft.photos.length,
      });
      if (!res.canceled) update({ photos: [...draft.photos, ...res.assets.map((a) => ({ uri: a.uri, mime: a.mimeType ?? 'image/jpeg' }))].slice(0, 5) });
    };
    if (Platform.OS === 'web') return fromLibrary();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('checkin.takePhoto'), t('checkin.fromLibrary'), t('common.cancel')], cancelButtonIndex: 2 },
        (i) => (i === 0 ? fromCamera() : i === 1 ? fromLibrary() : undefined),
      );
    } else {
      Alert.alert(t('checkin.addPhoto'), undefined, [
        { text: t('checkin.takePhoto'), onPress: fromCamera },
        { text: t('checkin.fromLibrary'), onPress: fromLibrary },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }

  function makeCover(i: number) {
    const photos = [...draft.photos];
    const [p] = photos.splice(i, 1);
    update({ photos: [p, ...photos] });
  }

  async function save() {
    if (!draft.rating && total == null) {
      setError(t('checkin.rateFirst'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const end = Date.now();
      const duration = draft.duration ?? (draft.startedAt ? minutesBetween(draft.startedAt, draft.endedAt ?? end) : null);
      const input = {
        cigarId: draft.cigar!.id, rating: draft.rating ?? scoreToRating(total!), note: draft.note,
        venueId: draft.venue?.id ?? null, eventTitle: draft.eventTitle, atHome: draft.atHome, visibility: draft.visibility,
        music: draft.music, pairings: draft.pairings, photos: draft.photos, scores: total != null ? draft.scores : null,
        strength: draft.strength, body: draft.body, duration, flavors: draft.flavors,
        clubId: draft.clubId, humidorItemId: draft.humidorItemId,
      };
      let id: string;
      if (draft.editingId) {
        id = draft.editingId;
        await updateCheckin(id, input, draft.keptPhotos);
      } else {
        id = await createCheckin(input);
      }
      reset();
      router.dismissAll();
      router.push(`/checkin/${id}`);
    } catch (e) {
      const msg = errorMessage(e);
      setError(msg.includes('MAX_PHOTOS') ? t('errors.MAX_PHOTOS') : msg);
    } finally {
      setBusy(false);
    }
  }

  const placeLabel = draft.atHome ? t('checkin.atHome') : draft.venue?.name ?? null;

  return (
    <Screen keyboard footer={<Button label={busy ? t('checkin.saving') : t('checkin.save')} onPress={save} loading={busy} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Row>
          <View style={{ flex: 1 }}>
            {draft.editingId ? <Text style={[type.caption, { color: colors.accent, fontFamily: fonts.bold }]}>{t('checkin.editing')}</Text> : null}
            <Text style={[type.title, { fontSize: 22 }]}>{cigarTitle(draft.cigar)}</Text>
            <Text style={type.caption}>{[draft.cigar.vitola, draft.cigar.wrapper_shade].filter(Boolean).join(' · ')}</Text>
          </View>
          {draft.editingId ? null : <Button label={t('common.change')} variant="ghost" small onPress={() => router.push('/checkin/pick-cigar')} />}
        </Row>

        <SmokeTimer running={running} startedAt={draft.startedAt} endedAt={draft.endedAt} duration={draft.duration}
          onStart={lightUp} onStop={putOut} onDuration={(duration) => update({ duration })} />

        <View style={{ gap: space.xs }}>
          <Text style={[type.overline, { textAlign: 'center' }]}>{t('checkin.yourRating')}</Text>
          <RatingInput value={draft.rating} onChange={(rating) => update({ rating })} />
        </View>

        <Field label={t('checkin.note')} value={draft.note} onChangeText={(note) => update({ note })} placeholder={t('checkin.notePlaceholder')} multiline maxLength={2000} />

        <View style={{ gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.label}>{t('checkin.photos')}</Text>
            <Text style={type.caption}>{draft.photos.length}/5</Text>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {draft.photos.map((p, i) => (
              <Pressable key={p.uri} onPress={() => (i ? makeCover(i) : undefined)} onLongPress={() => update({ photos: draft.photos.filter((_, j) => j !== i) })}
                accessibilityLabel={i === 0 ? t('checkin.cover') : t('checkin.photoHint')}>
                <Image source={{ uri: p.uri }} style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: i === 0 ? 2 : 0, borderColor: colors.accent }} />
                {i === 0 ? <View style={{ position: 'absolute', left: 6, bottom: 6 }}><Pill label={t('checkin.cover')} tone="accent" /></View> : null}
                <Pressable onPress={() => update({ photos: draft.photos.filter((_, j) => j !== i) })} accessibilityLabel={t('common.remove')} hitSlop={8}
                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#000A', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={16} />
                </Pressable>
              </Pressable>
            ))}
            {draft.photos.length < 5 ? (
              <Pressable onPress={addPhoto} accessibilityRole="button" accessibilityLabel={t('checkin.addPhoto')}
                style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera-outline" color={colors.textMuted} />
              </Pressable>
            ) : null}
          </ScrollView>
          {draft.photos.length > 1 ? <Text style={type.caption}>{t('checkin.photoHint')}</Text> : null}
        </View>

        <LinkRow icon="location-outline" title={t('checkin.place')} value={[placeLabel, draft.eventTitle].filter(Boolean).join(' · ') || t('checkin.pickPlace')} onPress={() => router.push('/checkin/place')} />

        <Card style={{ gap: space.sm }}>
          <Row><Icon name="wine-outline" size={20} color={colors.accent} /><Text style={type.label}>{t('checkin.pairing')}</Text></Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {draft.pairings.map((p, i) => (
              <Chip key={`${p.name}-${i}`} label={p.name} icon="close" onPress={() => update({ pairings: draft.pairings.filter((_, j) => j !== i) })} />
            ))}
            <Chip label={t('checkin.addPairing')} onPress={() => router.push('/checkin/pairing')} />
          </View>
        </Card>

        <MusicRow />

        <LinkRow
          icon="podium-outline" title={t('checkin.fullReview')}
          value={total != null ? t('checkinDetail.score', { score: total }) : t('checkin.fullReviewHint')}
          onPress={() => router.push('/checkin/review')} highlight={total != null}
        />

        <View style={{ gap: space.sm }}>
          <Text style={type.label}>{t('checkin.visibility')}</Text>
          <Segmented<Visibility>
            value={draft.visibility} onChange={(visibility) => update({ visibility })}
            options={[{ value: 'public', label: t('checkin.vis.public') }, { value: 'followers', label: t('checkin.vis.followers') }, { value: 'private', label: t('checkin.vis.private') }]}
          />
        </View>

        {(clubs.data ?? []).length > 0 && draft.visibility !== 'private' ? (
          <View style={{ gap: space.sm }}>
            <Text style={type.label}>{t('checkin.postToClub')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label={t('checkin.none')} selected={!draft.clubId} onPress={() => update({ clubId: null })} />
              {clubs.data!.map((m) => <Chip key={m.club.id} label={m.club.name} selected={draft.clubId === m.club.id} onPress={() => update({ clubId: m.club.id })} />)}
            </View>
          </View>
        ) : null}

        {(fromHumidor.data ?? []).length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Text style={type.label}>{t('checkin.fromHumidor')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label={t('checkin.none')} selected={!draft.humidorItemId} onPress={() => update({ humidorItemId: null })} />
              {fromHumidor.data!.map((h) => <Chip key={h.id} label={`${h.humidor.name} (${h.quantity})`} selected={draft.humidorItemId === h.id} onPress={() => update({ humidorItemId: h.id })} />)}
            </View>
          </View>
        ) : null}

        <ErrorText message={error} />
        <Button label={t('checkin.discard')} variant="ghost" small onPress={discard} />
      </View>
    </Screen>
  );
}

function SmokeTimer({ running, startedAt, endedAt, duration, onStart, onStop, onDuration }: {
  running: boolean; startedAt: number | null; endedAt: number | null; duration: number | null;
  onStart: () => void; onStop: () => void; onDuration: (m: number | null) => void;
}) {
  const { t } = useI18n();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  const secs = startedAt ? Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000)) : 0;
  const clock = `${Math.floor(secs / 3600) ? `${Math.floor(secs / 3600)}:` : ''}${String(Math.floor((secs % 3600) / 60)).padStart(Math.floor(secs / 3600) ? 2 : 1, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <Card style={{ gap: space.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row><Icon name="timer-outline" size={20} color={colors.accent} /><Text style={type.label}>{t('checkin.smokeTime')}</Text></Row>
        {startedAt ? <Text style={[type.title, { fontSize: 24, color: running ? colors.accent : colors.text }]}>{clock}</Text> : null}
      </Row>
      {!startedAt ? (
        <>
          <Button label={t('checkin.lightUp')} icon="flame-outline" onPress={onStart} />
          <Text style={type.caption}>{t('checkin.lightUpHint')}</Text>
        </>
      ) : running ? (
        <Button label={t('checkin.putOut')} variant="secondary" onPress={onStop} />
      ) : null}
      {startedAt && !running ? (
        <Field label={t('checkin.minutes')} keyboardType="number-pad" value={duration ? String(duration) : ''}
          onChangeText={(v) => onDuration(v ? Math.min(600, Number(v.replace(/\D/g, '')) || 0) || null : null)} />
      ) : null}
      {!startedAt ? (
        <Field label={t('checkin.minutes')} keyboardType="number-pad" value={duration ? String(duration) : ''}
          onChangeText={(v) => onDuration(v ? Math.min(600, Number(v.replace(/\D/g, '')) || 0) || null : null)} />
      ) : null}
    </Card>
  );
}

function LinkRow({ icon, title, value, onPress, highlight }: { icon: IconName; title: string; value: string; onPress: () => void; highlight?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: highlight ? colors.accent : colors.border, opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={20} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={type.caption}>{title}</Text>
        <Text style={[type.label, { fontFamily: fonts.semibold }]} numberOfLines={1}>{value}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function MusicRow() {
  const { t } = useI18n();
  const router = useRouter();
  const { draft, update } = useCheckinDraft();
  const m = draft.music;
  if (!m) {
    return <LinkRow icon="musical-notes-outline" title={t('checkin.music')} value={t('checkin.addMusic')} onPress={() => router.push('/checkin/music')} />;
  }
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}>
      {m.artworkUrl ? <Image source={{ uri: m.artworkUrl }} style={{ width: 48, height: 48, borderRadius: 8 }} /> : <Icon name="musical-notes" color={colors.accent} />}
      <View style={{ flex: 1 }}>
        <Text style={type.caption}>{t('checkin.music')}</Text>
        <Text style={[type.label, { fontFamily: fonts.semibold }]} numberOfLines={1}>{m.title}</Text>
        {m.artist ? <Text style={type.caption} numberOfLines={1}>{m.artist}</Text> : null}
      </View>
      <Pressable onPress={() => update({ music: null })} accessibilityLabel={t('common.remove')} style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" color={colors.textMuted} />
      </Pressable>
    </Card>
  );
}
