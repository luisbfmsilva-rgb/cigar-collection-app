import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ErrorText, Field, Row, Screen, SectionTitle, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { logReading, readings } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

/** Manual humidity / temperature entry for people without a connected hygrometer. */
export default function LogReading() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [rh, setRh] = useState('');
  const [temp, setTemp] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>(locale === 'en' ? 'F' : 'C');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useAsync(() => readings(id, 10), [id]);

  const rhN = rh ? Number(rh.replace(',', '.')) : null;
  const tN = temp ? Number(temp.replace(',', '.')) : null;
  const tempC = tN == null ? null : unit === 'F' ? Math.round(((tN - 32) * 5) / 9 * 10) / 10 : tN;
  const valid = (rhN != null || tempC != null) && (rhN == null || (rhN >= 0 && rhN <= 100)) && (tempC == null || (tempC >= -10 && tempC <= 50));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await logReading(id, rhN, tempC);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const show = (c: number | null) => (c == null ? '–' : unit === 'F' ? `${Math.round((c * 9) / 5 + 32)}°F` : `${Number(c)}°C`);

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('humidor.readingTitle')}</Text>
        <Field label={`${t('humidor.humidity')} (%)`} value={rh} onChangeText={setRh} keyboardType="decimal-pad" placeholder="69" autoFocus />
        <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
          <Field label={`${t('humidor.temperature')} (°${unit})`} value={temp} onChangeText={setTemp} keyboardType="decimal-pad" placeholder={unit === 'F' ? '70' : '21'} style={{ flex: 1 }} />
          <View style={{ width: 120 }}>
            <Segmented value={unit} onChange={setUnit} options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]} />
          </View>
        </Row>
        <ErrorText message={error} />
        {(history.data ?? []).length > 0 ? (
          <>
            <SectionTitle title={t('humidor.history')} />
            {history.data!.map((r) => (
              <Row key={r.id} style={{ justifyContent: 'space-between', minHeight: 32 }}>
                <Text style={type.caption}>{timeAgo(r.recorded_at, t)}</Text>
                <Text style={type.label}>{r.rh != null ? `${Number(r.rh)}%` : '–'} · {show(r.temp_c)}</Text>
              </Row>
            ))}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
