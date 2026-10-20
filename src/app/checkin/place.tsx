import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button, Card, Chip, ErrorText, Field, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createVenue, nearbyVenues, searchVenues } from '@/lib/api';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { Venue, VENUE_KINDS, VenueKind } from '@/lib/types';
import { errorMessage } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

export default function PlacePicker() {
  const { t, s } = useI18n();
  const router = useRouter();
  const { draft, update } = useCheckinDraft();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Venue[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<VenueKind>('shop');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventTitle, setEventTitle] = useState(draft.eventTitle);

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError(t('place.locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(c);
      setList(await nearbyVenues(c.lat, c.lng));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(locate, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const found = useSearch(q, searchVenues);
  const shown = found.data ?? list;

  function done(patch: Partial<typeof draft>) {
    update({ ...patch, eventTitle: eventTitle.trim() });
    router.back();
  }

  async function addVenue() {
    setBusy(true);
    setError(null);
    try {
      const v = await createVenue({ name: name.trim(), kind, city: city.trim() || undefined, region: region.trim() || undefined, lat: coords?.lat ?? null, lng: coords?.lng ?? null });
      done({ venue: v, atHome: false });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('place.title')}</Text>
        <Field label={t('place.event')} value={eventTitle} onChangeText={setEventTitle} placeholder={t('place.eventPlaceholder')} maxLength={120} />
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={t('checkin.atHome')} icon="home-outline" selected={draft.atHome} onPress={() => done({ atHome: true, venue: null })} />
          {draft.venue || draft.atHome ? <Chip label={t('place.clear')} icon="close" onPress={() => done({ atHome: false, venue: null })} /> : null}
          {eventTitle.trim() !== draft.eventTitle ? <Chip label={t('common.save')} icon="checkmark" selected onPress={() => done({})} /> : null}
        </Row>
        <Field value={q} onChangeText={setQ} placeholder={t('place.search')} autoCorrect={false} />
        <ErrorText message={error} />
        <SectionTitle title={q.trim().length >= 2 ? t('common.search') : t('place.nearby')} action={coords ? undefined : t('place.useLocation')} onAction={locate} />
        {locating ? <ActivityIndicator color={colors.accent} /> : null}
        <View style={{ gap: space.sm }}>
          {shown.map((v) => (
            <Pressable key={v.id} onPress={() => done({ venue: v, atHome: false })} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 56, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: draft.venue?.id === v.id ? colors.accent : colors.border, opacity: pressed ? 0.85 : 1 })}>
              <Icon name={v.kind === 'lounge' ? 'cafe-outline' : v.kind === 'bar' ? 'wine-outline' : 'storefront-outline'} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { fontFamily: fonts.semibold }]}>{v.name}</Text>
                <Text style={type.caption}>{[s.place.kinds[v.kind], v.city, v.region].filter(Boolean).join(' · ')}</Text>
              </View>
            </Pressable>
          ))}
          {!locating && shown.length === 0 ? <Text style={[type.caption]}>{t('common.empty')}</Text> : null}
        </View>

        {adding ? (
          <Card style={{ gap: space.md }}>
            <Text style={type.heading}>{t('place.addNew')}</Text>
            <Field label={t('place.name')} value={name} onChangeText={setName} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {VENUE_KINDS.map((k) => <Chip key={k} label={s.place.kinds[k]} selected={kind === k} onPress={() => setKind(k)} />)}
            </View>
            <Field label={t('place.city')} value={city} onChangeText={setCity} />
            <Field label={t('place.region')} value={region} onChangeText={setRegion} />
            {coords ? <Text style={type.caption}>{t('place.usingLocation')}</Text> : null}
            <Button label={t('common.add')} onPress={addVenue} loading={busy} disabled={name.trim().length < 2} />
          </Card>
        ) : (
          <Button label={t('place.addNew')} variant="secondary" icon="add" onPress={() => { setAdding(true); setName(q.trim()); }} />
        )}
      </View>
    </Screen>
  );
}
