import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { CigarRow } from '@/components/CigarRow';
import { Button, Chip, ErrorText, Field, IconButton, Row, Screen, Stepper } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addHumidorItem, getCigar, myHumidors, searchCigars } from '@/lib/api';
import { isoDate } from '@/lib/format';
import { space, type } from '@/lib/theme';
import type { Cigar } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

export default function AddToHumidor() {
  const { cigarId, humidorId } = useLocalSearchParams<{ cigarId?: string; humidorId?: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const humidors = useAsync(() => myHumidors(), []);
  const [hidPicked, setHid] = useState<string | null>(humidorId || null);
  const hid = hidPicked ?? humidors.data?.[0]?.id ?? null;
  const [cigar, setCigar] = useState<Cigar | null>(null);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState(1);
  const [acquired, setAcquired] = useState(isoDate(new Date()));
  const [rest, setRest] = useState('14');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cigarId) getCigar(cigarId).then(setCigar).catch(() => {});
  }, [cigarId]);

  const results = useSearch(q, searchCigars).data ?? [];

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(acquired) && !Number.isNaN(Date.parse(acquired));

  async function save() {
    if (!cigar || !hid) return;
    setBusy(true);
    setError(null);
    try {
      await addHumidorItem({
        humidor_id: hid, cigar_id: cigar.id, quantity: qty, acquired_on: acquired, rest_days: Number(rest) || 0,
        price_each: price ? Number(price.replace(',', '.')) : null, notes: notes.trim() || null,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (humidors.data && humidors.data.length === 0) {
    return (
      <Screen>
        <Text style={type.body}>{t('humidor.noHumidor')}</Text>
        <Button label={t('humidor.newHumidor')} onPress={() => router.replace('/humidor/new')} style={{ marginTop: space.lg }} />
      </Screen>
    );
  }

  return (
    <Screen keyboard footer={<Button label={t('common.add')} onPress={save} loading={busy} disabled={!cigar || !hid || qty < 1 || !dateOk} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('humidor.addCigar')}</Text>
        {cigar ? (
          <CigarRow cigar={cigar} onPress={() => setCigar(null)} right={<Text style={type.caption}>{t('common.change')}</Text>} />
        ) : (
          <View style={{ gap: space.sm }}>
            <Row>
              <Field value={q} onChangeText={setQ} placeholder={t('explore.searchPlaceholder')} autoCorrect={false} style={{ flex: 1 }} />
              <IconButton icon="barcode-outline" label={t('explore.scan')} filled onPress={() => router.replace({ pathname: '/scan', params: { then: 'humidor', humidorId: hid ?? '' } })} />
            </Row>
            {results.map((c) => <CigarRow key={c.id} cigar={c} onPress={() => setCigar(c)} />)}
          </View>
        )}
        {(humidors.data ?? []).length > 1 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {humidors.data!.map((h) => <Chip key={h.id} label={h.name} selected={hid === h.id} onPress={() => setHid(h.id)} />)}
          </View>
        ) : null}
        <Stepper label={t('humidor.quantity')} value={qty} onChange={setQty} min={1} max={500} />
        <Field label={t('humidor.acquired')} value={acquired} onChangeText={setAcquired} placeholder="YYYY-MM-DD" hint="YYYY-MM-DD" error={dateOk ? null : 'YYYY-MM-DD'} />
        <Field label={t('humidor.restDays')} value={rest} onChangeText={(v) => setRest(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label={`${t('humidor.price')} (${t('common.optional')})`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Field label={t('humidor.notes')} value={notes} onChangeText={setNotes} multiline maxLength={500} />
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
