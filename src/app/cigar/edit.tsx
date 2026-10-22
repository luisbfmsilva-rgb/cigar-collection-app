import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Empty, ErrorText, Field, Loading, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getCigar, isBrandManager, suggestCigarChange, updateCigar } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { cigarTitle } from '@/lib/format';
import { space, type } from '@/lib/theme';
import { Cigar, CigarPatch, STRENGTHS, Strength } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

const SHADES = ['Claro', 'Natural', 'Colorado', 'Maduro', 'Oscuro', 'Candela'];
const STATUSES: Cigar['status'][] = ['regular', 'limited', 'discontinued'];

/** Manufacturers (own brand) and admins edit directly; Experts send a suggestion to the moderators. */
export default function EditCigar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const me = useMe();
  const data = useAsync(async () => {
    const cigar = await getCigar(id);
    const manager = cigar ? await isBrandManager(cigar.brand_id) : false;
    return { cigar, direct: me.is_admin || manager };
  }, [id]);

  if (data.loading && !data.data) return <Loading />;
  const c = data.data?.cigar;
  if (!c) return <Screen><ErrorText message={data.error ?? t('common.error')} /></Screen>;
  if (!data.data!.direct && me.account_type !== 'expert') return <Screen><Empty text={t('common.error')} /></Screen>;
  return <EditForm cigar={c} direct={data.data!.direct} />;
}

function EditForm({ cigar: c, direct }: { cigar: Cigar; direct: boolean }) {
  const { t, s } = useI18n();
  const router = useRouter();
  const [line, setLine] = useState(c.line);
  const [vitola, setVitola] = useState(c.vitola ?? '');
  const [length, setLength] = useState(c.length_in != null ? String(c.length_in) : '');
  const [ring, setRing] = useState(c.ring_gauge != null ? String(c.ring_gauge) : '');
  const [wrapper, setWrapper] = useState(c.wrapper ?? '');
  const [shade, setShade] = useState(c.wrapper_shade ?? '');
  const [binder, setBinder] = useState(c.binder ?? '');
  const [filler, setFiller] = useState(c.filler ?? '');
  const [country, setCountry] = useState(c.country ?? '');
  const [factory, setFactory] = useState(c.factory ?? '');
  const [strength, setStrength] = useState<Strength | null>(c.strength);
  const [status, setStatus] = useState<Cigar['status']>(c.status);
  const [barcodes, setBarcodes] = useState(c.barcodes.join(', '));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const lengthNum = length.trim() ? Number(length.replace(',', '.')) : null;
  const ringNum = ring.trim() ? Number(ring) : null;
  const sizeOk = (lengthNum == null || (lengthNum >= 2 && lengthNum <= 12)) && (ringNum == null || (ringNum >= 20 && ringNum <= 80));
  const codes = barcodes.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);

  // Only the fields that actually changed go into the patch.
  const patch: CigarPatch = {};
  const txt = (v: string) => v.trim() || null;
  if (line.trim() && line.trim() !== c.line) patch.line = line.trim();
  if (txt(vitola) !== c.vitola) patch.vitola = txt(vitola);
  if (lengthNum !== (c.length_in != null ? Number(c.length_in) : null)) patch.length_in = lengthNum;
  if (ringNum !== c.ring_gauge) patch.ring_gauge = ringNum;
  if (txt(wrapper) !== c.wrapper) patch.wrapper = txt(wrapper);
  if (txt(shade) !== c.wrapper_shade) patch.wrapper_shade = txt(shade);
  if (txt(binder) !== c.binder) patch.binder = txt(binder);
  if (txt(filler) !== c.filler) patch.filler = txt(filler);
  const cc = /^[A-Za-z]{2}$/.test(country.trim()) ? country.trim().toUpperCase() : null;
  if (cc !== c.country && (cc || !country.trim())) patch.country = cc;
  if (txt(factory) !== c.factory) patch.factory = txt(factory);
  if (strength !== c.strength) patch.strength = strength;
  if (status !== c.status) patch.status = status;
  if (codes.join(',') !== c.barcodes.join(',')) patch.barcodes = codes;
  const changed = Object.keys(patch).length > 0;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (direct) {
        await updateCigar(c.id, patch);
        router.back();
      } else {
        await suggestCigarChange(c.id, patch, note);
        setDone(true);
      }
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
          <Text style={type.title}>{t('suggest.title')}</Text>
          <Text style={type.body}>{t('suggest.sent')}</Text>
          <Button label={t('common.done')} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboard footer={
      <Button label={direct ? t('common.save') : t('suggest.send')} onPress={submit} loading={busy} disabled={!changed || !sizeOk} style={{ flex: 1 }} />
    }>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{direct ? t('suggest.editTitle') : t('suggest.title')}</Text>
        <Text style={type.label}>{cigarTitle(c)}</Text>
        <Text style={type.caption}>{direct ? t('suggest.editIntro') : t('suggest.intro')}</Text>
        <Field label={t('newCigar.line')} value={line} onChangeText={setLine} />
        <Field label={t('newCigar.vitola')} value={vitola} onChangeText={setVitola} />
        <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
          <Field label={t('newCigar.length')} value={length} onChangeText={setLength} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Field label={t('newCigar.ring')} value={ring} onChangeText={(v) => setRing(v.replace(/\D/g, ''))} keyboardType="number-pad" style={{ flex: 1 }} />
        </Row>
        <Field label={t('newCigar.wrapper')} value={wrapper} onChangeText={setWrapper} />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('newCigar.shade')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {SHADES.map((x) => <Chip key={x} label={x} selected={shade === x} onPress={() => setShade(shade === x ? '' : x)} />)}
          </View>
        </View>
        <Field label={t('newCigar.binder')} value={binder} onChangeText={setBinder} />
        <Field label={t('newCigar.filler')} value={filler} onChangeText={setFiller} />
        <Field label={t('newCigar.country')} value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} placeholder={t('common.countryPlaceholder')} />
        <Field label={t('suggest.factory')} value={factory} onChangeText={setFactory} />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('newCigar.strength')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {STRENGTHS.map((x) => <Chip key={x} label={s.cigar.strengths[x]} selected={strength === x} onPress={() => setStrength(strength === x ? null : x)} />)}
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('suggest.status')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {STATUSES.map((x) => <Chip key={x} label={s.cigar.status[x]} selected={status === x} onPress={() => setStatus(x)} />)}
          </View>
        </View>
        <Field label={t('suggest.barcodes')} value={barcodes} onChangeText={setBarcodes} keyboardType="numbers-and-punctuation" />
        {!direct ? <Field label={t('suggest.note')} value={note} onChangeText={setNote} multiline maxLength={500} /> : null}
        {!changed ? <Text style={type.caption}>{t('suggest.nothing')}</Text> : null}
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
