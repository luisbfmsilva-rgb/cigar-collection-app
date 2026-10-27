import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, Loading, Screen, Stepper } from '@/components/ui';
import { useI18n } from '@/i18n';
import { deleteHumidorItem, updateHumidorItem } from '@/lib/api';
import { useStartCheckin } from '@/lib/useStartCheckin';
import { cigarTitle, daysSince, storedFor } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { space, type } from '@/lib/theme';
import type { HumidorItem } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

export default function HumidorItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const startCheckin = useStartCheckin();
  const item = useAsync(async () => {
    const { data, error } = await supabase.from('humidor_items')
      .select('*, cigar:cigars(id, line, vitola, wrapper_shade, brand:brands(name))').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as unknown as HumidorItem & { cigar: { wrapper_shade: string | null } };
  }, [id]);
  const [qty, setQty] = useState(0);
  const [rest, setRest] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [loadedFor, setLoadedFor] = useState<unknown>(null);
  if (item.data && loadedFor !== item.data) {
    setLoadedFor(item.data);
    setQty(item.data.quantity);
    setRest(String(item.data.rest_days));
    setNotes(item.data.notes ?? '');
  }

  if (item.loading && !item.data) return <Loading />;
  const it = item.data;
  if (!it || !it.cigar) return <Screen><ErrorText message={item.error ?? t('common.error')} /></Screen>;
  const name = cigarTitle({ brand_name: it.cigar.brand?.name, line: it.cigar.line });
  const age = daysSince(it.acquired_on);

  async function save() {
    try {
      await updateHumidorItem(id, { quantity: qty, rest_days: Number(rest) || 0, notes: notes.trim() || null });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function smokeOne() {
    startCheckin({
      cigar: { id: it!.cigar!.id, brand_name: it!.cigar!.brand?.name ?? '', line: it!.cigar!.line, vitola: it!.cigar!.vitola, wrapper_shade: it!.cigar!.wrapper_shade },
      humidorItemId: id,
    });
  }

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={save} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.title} accessibilityRole="header">{name}</Text>
        <Text style={type.caption}>{[it.cigar.vitola, t('humidor.storedFor', { time: storedFor(it.acquired_on, t) }), it.price_each ? `$${Number(it.price_each).toFixed(2)}` : null].filter(Boolean).join(' · ')}</Text>
        <Card style={{ gap: space.sm }}>
          <Button label={t('humidor.smokeOne')} icon="flame-outline" onPress={smokeOne} disabled={qty < 1} />
          <Text style={type.caption}>{t('humidor.smokeOneHint')}</Text>
          {age < it.rest_days ? <Text style={type.caption}>{t('humidor.restingDays', { days: it.rest_days - age })}</Text> : null}
        </Card>
        <Stepper label={t('humidor.quantity')} value={qty} onChange={setQty} />
        <Field label={t('humidor.restDays')} value={rest} onChangeText={(v) => setRest(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label={t('humidor.notes')} value={notes} onChangeText={setNotes} multiline maxLength={500} />
        <Button label={t('humidor.viewCigar')} variant="secondary" onPress={() => router.push(`/cigar/${it.cigar!.id}`)} />
        <Button label={t('common.delete')} variant="ghost" onPress={() => Alert.alert(t('common.delete'), name, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => deleteHumidorItem(id).then(() => router.back()) },
        ])} />
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
