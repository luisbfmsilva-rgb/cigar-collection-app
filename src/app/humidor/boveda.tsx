import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chip, ErrorText, Field, Pill, Row, Screen, Stepper } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addBovedaPack, bovedaPacks, deleteBovedaPack, humidorItems, myHumidors, updateBovedaPack } from '@/lib/api';
import { BOVEDA_RH, BOVEDA_SIZES, CIGARS_PER_60G, coverage, daysLeft, scheduleBovedaReminders, suggestedDays } from '@/lib/boveda';
import { colors, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

/** Boveda packs of one humidor: how many it needs, what is installed, and when each pack should be replaced. */
export default function BovedaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const data = useAsync(async () => {
    const [packs, items, humidors] = await Promise.all([bovedaPacks(id), humidorItems(id), myHumidors()]);
    return { packs, stock: items.reduce((n, i) => n + i.quantity, 0), humidor: humidors.find((h) => h.id === id) ?? null };
  }, [id]);
  const [size, setSize] = useState<(typeof BOVEDA_SIZES)[number]>(60);
  const [rh, setRh] = useState<number>(69);
  const [qty, setQty] = useState(1);
  const [days, setDays] = useState(String(suggestedDays(60)));
  const [error, setError] = useState<string | null>(null);

  const packs = data.data?.packs ?? [];
  const humidor = data.data?.humidor;
  const cigars = Math.max(humidor?.capacity ?? 0, data.data?.stock ?? 0);
  const cov = coverage(packs, cigars);

  useEffect(() => {
    scheduleBovedaReminders(packs, t('boveda.notifTitle'), (p) => t('boveda.notifBody', { name: humidor?.name ?? '', size: p.size_g }));
  }, [packs, humidor?.name, t]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      data.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function add() {
    const d = Math.min(730, Math.max(7, Number(days) || suggestedDays(size)));
    run(() => addBovedaPack({ humidor_id: id, size_g: size, rh, quantity: qty, installed_on: new Date().toISOString().slice(0, 10), replace_after_days: d }));
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('boveda.title')}</Text>

        <Card style={{ gap: space.sm }}>
          {cigars === 0 ? (
            <Text style={type.body}>{t('boveda.noSize')}</Text>
          ) : (
            <>
              <Text style={type.body}>{t('boveda.need', { cigars, packs: cov.needed })}</Text>
              <Text style={type.caption}>{t('boveda.have', { packs: cov.have })}</Text>
              {cov.missing > 0 ? <Pill label={t('boveda.addMore', { count: cov.missing })} tone="warning" /> : <Pill label={t('boveda.enough')} tone="success" />}
            </>
          )}
          <Text style={[type.caption, { fontSize: 11 }]}>{t('boveda.rule', { n: CIGARS_PER_60G })}</Text>
        </Card>

        {packs.map((p) => {
          const left = daysLeft(p);
          return (
            <Card key={p.id} style={{ gap: space.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={type.heading}>{p.quantity} × {p.size_g} g · {p.rh}%</Text>
                <Pill label={left <= 0 ? t('boveda.replaceNow') : t('boveda.daysLeft', { days: left })} tone={left <= 0 ? 'warning' : left <= 14 ? 'warning' : 'success'} />
              </Row>
              <Text style={type.caption}>{t('boveda.installed', { date: p.installed_on, days: p.replace_after_days })}</Text>
              <Field label={t('boveda.replaceEvery')} keyboardType="number-pad" defaultValue={String(p.replace_after_days)}
                onEndEditing={(e) => { const d = Math.min(730, Math.max(7, Number(e.nativeEvent.text) || p.replace_after_days)); if (d !== p.replace_after_days) run(() => updateBovedaPack(p.id, { replace_after_days: d })); }} />
              <Row>
                <Button label={t('boveda.replacedToday')} small style={{ flex: 1 }} onPress={() => run(() => updateBovedaPack(p.id, { installed_on: new Date().toISOString().slice(0, 10) }))} />
                <Button label={t('common.delete')} small variant="ghost" onPress={() => Alert.alert(t('common.delete'), `${p.quantity} × ${p.size_g} g`, [
                  { text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => run(() => deleteBovedaPack(p.id)) },
                ])} />
              </Row>
            </Card>
          );
        })}

        <Card style={{ gap: space.md }}>
          <Text style={type.heading}>{t('boveda.addPack')}</Text>
          <View style={{ gap: 6 }}>
            <Text style={type.label}>{t('boveda.size')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {BOVEDA_SIZES.map((s) => <Chip key={s} label={`${s} g`} selected={size === s} onPress={() => { setSize(s); setDays(String(suggestedDays(s))); }} />)}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={type.label}>{t('boveda.rh')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {BOVEDA_RH.map((r) => <Chip key={r} label={`${r}%`} selected={rh === r} onPress={() => setRh(r)} />)}
            </View>
          </View>
          <Stepper label={t('boveda.quantity')} value={qty} onChange={setQty} min={1} max={50} />
          <Field label={t('boveda.replaceEvery')} value={days} onChangeText={(v) => setDays(v.replace(/\D/g, ''))} keyboardType="number-pad" hint={t('boveda.suggested', { days: suggestedDays(size) })} />
          <Button label={t('common.add')} onPress={add} />
        </Card>
        <ErrorText message={error} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('boveda.source')}</Text>
      </View>
    </Screen>
  );
}
