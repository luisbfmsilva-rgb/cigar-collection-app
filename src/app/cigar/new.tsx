import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, ErrorText, Field, IconButton, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { brandsLike, submitCigar } from '@/lib/api';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, radius, space, type } from '@/lib/theme';
import { STRENGTHS, Strength } from '@/lib/types';
import { errorMessage } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

const SHADES = ['Claro', 'Natural', 'Colorado', 'Maduro', 'Oscuro', 'Candela'];

export default function NewCigar() {
  const { t, s } = useI18n();
  const router = useRouter();
  const { q, barcode: scanned, forCheckin } = useLocalSearchParams<{ q?: string; barcode?: string; forCheckin?: string }>();
  const { update } = useCheckinDraft();
  const [brand, setBrand] = useState(q ?? '');
  const [line, setLine] = useState('');
  const [vitola, setVitola] = useState('');
  const [length, setLength] = useState('');
  const [ring, setRing] = useState('');
  const [wrapper, setWrapper] = useState('');
  const [shade, setShade] = useState('');
  const [binder, setBinder] = useState('');
  const [filler, setFiller] = useState('');
  const [country, setCountry] = useState('');
  const [strength, setStrength] = useState<Strength | null>(null);
  const [barcode, setBarcode] = useState(scanned ?? '');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [lastScanned, setLastScanned] = useState(scanned);
  if (scanned !== lastScanned) {
    setLastScanned(scanned);
    if (scanned) setBarcode(scanned);
  }
  const brandHints = useSearch(brand, brandsLike, { minLength: 1, delay: 250 }).data ?? [];

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  const lengthNum = length ? Number(length.replace(',', '.')) : null;
  const ringNum = ring ? Number(ring) : null;
  const valid = brand.trim().length > 1 && line.trim().length > 0
    && (lengthNum == null || (lengthNum >= 2 && lengthNum <= 12)) && (ringNum == null || (ringNum >= 20 && ringNum <= 80));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const id = await submitCigar({
        brandName: brand, line, vitola, length_in: lengthNum, ring_gauge: ringNum, wrapper, wrapper_shade: shade,
        binder, filler, country: /^[A-Za-z]{2}$/.test(country.trim()) ? country.trim() : null, strength, barcode, bandPhotoUri: photo,
      });
      setDone(id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <View style={{ gap: space.lg, paddingTop: space.xxl }}>
          <Text style={type.title}>{t('newCigar.title')}</Text>
          <Text style={type.body}>{t('newCigar.submitted')}</Text>
          <Button label={t('cigar.checkin')} onPress={() => {
            update({ cigar: { id: done, brand_name: brand.trim(), line: line.trim(), vitola: vitola || null, wrapper_shade: shade || null } });
            router.replace('/checkin/new');
          }} />
          <Button label={t('common.done')} variant="secondary" onPress={() => (forCheckin ? router.back() : router.replace(`/cigar/${done}`))} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboard footer={<Button label={t('newCigar.submit')} onPress={submit} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('newCigar.title')}</Text>
        <Text style={type.caption}>{t('newCigar.intro')}</Text>
        <View style={{ gap: 6 }}>
          <Field label={t('newCigar.brand')} value={brand} onChangeText={setBrand} placeholder="Le Cigar, Padrón…" />
          {brandHints.length > 0 && !brandHints.some((b) => b.name.toLowerCase() === brand.trim().toLowerCase()) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {brandHints.slice(0, 6).map((b) => <Chip key={b.id} label={b.name} onPress={() => setBrand(b.name)} small />)}
            </View>
          ) : null}
        </View>
        <Field label={t('newCigar.line')} value={line} onChangeText={setLine} />
        <Field label={t('newCigar.vitola')} value={vitola} onChangeText={setVitola} placeholder="Robusto, Toro, Torpedo…" />
        <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
          <Field label={t('newCigar.length')} value={length} onChangeText={setLength} keyboardType="decimal-pad" placeholder='5.5' style={{ flex: 1 }} />
          <Field label={t('newCigar.ring')} value={ring} onChangeText={(v) => setRing(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="52" style={{ flex: 1 }} />
        </Row>
        <Field label={t('newCigar.wrapper')} value={wrapper} onChangeText={setWrapper} placeholder="Habano, Connecticut, Mata Fina…" />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('newCigar.shade')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {SHADES.map((x) => <Chip key={x} label={x} selected={shade === x} onPress={() => setShade(shade === x ? '' : x)} />)}
          </View>
        </View>
        <Field label={t('newCigar.binder')} value={binder} onChangeText={setBinder} />
        <Field label={t('newCigar.filler')} value={filler} onChangeText={setFiller} />
        <Field label={t('newCigar.country')} value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} placeholder={t('common.countryPlaceholder')} />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('newCigar.strength')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {STRENGTHS.map((x) => <Chip key={x} label={s.cigar.strengths[x]} selected={strength === x} onPress={() => setStrength(strength === x ? null : x)} />)}
          </View>
        </View>
        <Row gap={space.sm} style={{ alignItems: 'flex-end' }}>
          <Field label={t('newCigar.barcode')} value={barcode} onChangeText={setBarcode} keyboardType="number-pad" style={{ flex: 1 }} />
          <IconButton icon="barcode-outline" label={t('explore.scan')} filled onPress={() => router.push({ pathname: '/scan', params: { then: 'new' } })} />
        </Row>
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('newCigar.photo')}</Text>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 180, borderRadius: radius.md }} contentFit="cover" /> : null}
          <Button label={photo ? t('common.change') : t('checkin.fromLibrary')} variant="secondary" icon="image-outline" small onPress={pickPhoto} />
        </View>
        <ErrorText message={error} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('newCigar.dataNote')}</Text>
      </View>
    </Screen>
  );
}
