import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Chip, ErrorText, Field, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createHumidor, deleteHumidor, myHumidors, updateHumidor } from '@/lib/api';
import { space, type } from '@/lib/theme';
import { HUMIDOR_KINDS, HumidorKind } from '@/lib/types';
import { errorMessage } from '@/lib/useAsync';

/** Create a humidor, or edit one when `id` is passed. */
export default function HumidorForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, s } = useI18n();
  const router = useRouter();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HumidorKind>('desktop');
  const [capacity, setCapacity] = useState('');
  const [min, setMin] = useState('65');
  const [max, setMax] = useState('70');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    myHumidors().then((list) => {
      const h = list.find((x) => x.id === id);
      if (!h) return;
      setName(h.name);
      setKind(h.kind);
      setCapacity(h.capacity ? String(h.capacity) : '');
      setMin(String(Number(h.target_rh_min)));
      setMax(String(Number(h.target_rh_max)));
    });
  }, [id]);

  const minN = Number(min.replace(',', '.')), maxN = Number(max.replace(',', '.'));
  const valid = name.trim().length > 0 && minN >= 50 && maxN <= 85 && minN <= maxN;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const data = { name: name.trim(), kind, capacity: capacity ? Number(capacity) : null, target_rh_min: minN, target_rh_max: maxN };
      if (id) await updateHumidor(id, data);
      else await createHumidor(data);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (!id) return;
    Alert.alert(t('common.delete'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteHumidor(id).then(() => router.back()).catch((e) => setError(errorMessage(e))) },
    ]);
  }

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{id ? t('common.edit') : t('humidor.newHumidor')}</Text>
        <Field label={t('humidor.name')} value={name} onChangeText={setName} maxLength={40} placeholder="Humidor da sala" />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('humidor.kind')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {HUMIDOR_KINDS.map((k) => <Chip key={k} label={s.humidor.kinds[k]} selected={kind === k} onPress={() => setKind(k)} />)}
          </View>
        </View>
        <Field label={t('humidor.capacity')} value={capacity} onChangeText={(v) => setCapacity(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
          <Field label={t('humidor.targetMin')} value={min} onChangeText={setMin} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Field label={t('humidor.targetMax')} value={max} onChangeText={setMax} keyboardType="decimal-pad" style={{ flex: 1 }} />
        </Row>
        <ErrorText message={error} />
        {id ? <Button label={t('common.delete')} variant="ghost" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}
