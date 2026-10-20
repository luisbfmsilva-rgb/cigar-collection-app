import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CigarRow } from '@/components/CigarRow';
import { Button, Card, Chip, Empty, IconButton, Loading, Pill, Row, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { humidorItems, myHumidors, myWishlist, readings } from '@/lib/api';
import { cigarTitle, daysSince, storedFor, timeAgo } from '@/lib/format';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Humidor, HumidorItem } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

type Tab = 'stock' | 'wishlist';

export default function HumidorTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const humidors = useAsync(() => myHumidors(), []);
  const [picked, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('stock');
  const list = humidors.data ?? [];
  const current = list.find((h) => h.id === picked) ?? list[0] ?? null;
  const selected = current?.id ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Row style={{ paddingHorizontal: space.xl, paddingTop: space.md, justifyContent: 'space-between' }}>
        <Text style={type.display} accessibilityRole="header">{t('humidor.title')}</Text>
        <IconButton icon="barcode-outline" label={t('explore.scan')} filled onPress={() => router.push({ pathname: '/scan', params: { then: 'humidor', humidorId: selected ?? '' } })} />
      </Row>

      {humidors.loading && !humidors.data ? <Loading /> : (humidors.data ?? []).length === 0 ? (
        <Screen>
          <Empty text={t('humidor.noHumidor')} action={t('humidor.newHumidor')} onAction={() => router.push('/humidor/new')} icon="file-tray-stacked-outline" />
        </Screen>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.sm }}>
            {humidors.data!.map((h) => (
              <Pressable key={h.id} onLongPress={() => router.push({ pathname: '/humidor/new', params: { id: h.id } })}>
                <Chip label={h.name} selected={h.id === selected} onPress={() => setSelected(h.id)} />
              </Pressable>
            ))}
            <Chip label="+" onPress={() => router.push('/humidor/new')} />
          </ScrollView>
          {current ? <HumidorBody humidor={current} tab={tab} setTab={setTab} onReload={humidors.reload} /> : null}
        </>
      )}
    </View>
  );
}

function HumidorBody({ humidor, tab, setTab, onReload }: { humidor: Humidor; tab: Tab; setTab: (t: Tab) => void; onReload: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const items = useAsync(() => humidorItems(humidor.id), [humidor.id]);
  const last = useAsync(() => readings(humidor.id, 1), [humidor.id]);
  const wishlist = useAsync(() => (tab === 'wishlist' ? myWishlist() : Promise.resolve([])), [tab]);
  const reading = last.data?.[0];
  const total = (items.data ?? []).reduce((n, i) => n + i.quantity, 0);
  const outOfRange = reading?.rh != null && (reading.rh < humidor.target_rh_min || reading.rh > humidor.target_rh_max);

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={() => { items.reload(); last.reload(); onReload(); }} tintColor={colors.accent} />}>
      <View style={{ gap: space.md }}>
        <Card style={{ gap: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{t('humidor.conditions')}</Text>
            {outOfRange ? <Pill label={t('humidor.outOfRange')} tone="warning" /> : <Pill label={t('humidor.manual')} />}
          </Row>
          <Row gap={0} style={{ justifyContent: 'space-between' }}>
            <Metric value={reading?.rh != null ? `${Number(reading.rh)}%` : '–'} label={t('humidor.humidity')} accent={!outOfRange} warn={outOfRange} />
            <Metric value={reading?.temp_c != null ? `${Number(reading.temp_c)}°C` : '–'} label={t('humidor.temperature')} />
            <Metric value={String(total)} label={t('humidor.cigars')} />
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[type.caption, { flex: 1 }]}>
              {reading ? t('humidor.lastReading', { when: timeAgo(reading.recorded_at, t) }) : t('humidor.noReading')}
              {'\n'}{t('humidor.target', { min: Number(humidor.target_rh_min), max: Number(humidor.target_rh_max) })}
            </Text>
            <Button label={t('humidor.logReading')} small onPress={() => router.push({ pathname: '/humidor/reading', params: { id: humidor.id } })} />
          </Row>
          <Text style={[type.caption, { fontSize: 11 }]}>{t('humidor.sensorSoon')}</Text>
        </Card>

        <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'stock', label: t('humidor.stock') }, { value: 'wishlist', label: t('humidor.wishlist') }]} />

        {tab === 'stock' ? (
          <>
            <Button label={t('humidor.addCigar')} icon="add" variant="secondary" small onPress={() => router.push({ pathname: '/humidor/add', params: { humidorId: humidor.id } })} />
            {(items.data ?? []).map((i) => <StockRow key={i.id} item={i} />)}
            {(items.data ?? []).length === 0 && !items.loading ? <Empty text={t('humidor.empty')} /> : null}
          </>
        ) : (
          <>
            {(wishlist.data ?? []).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} />)}
            {(wishlist.data ?? []).length === 0 && !wishlist.loading ? <Empty text={t('humidor.wishlistEmpty')} icon="heart-outline" /> : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function StockRow({ item }: { item: HumidorItem }) {
  const { t } = useI18n();
  const router = useRouter();
  const age = daysSince(item.acquired_on);
  const ready = age >= item.rest_days;
  const name = item.cigar ? cigarTitle({ brand_name: item.cigar.brand?.name, line: item.cigar.line }) : '—';
  return (
    <Pressable onPress={() => router.push({ pathname: '/humidor/item', params: { id: item.id } })} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.label, { fontFamily: fonts.bold, fontSize: 15 }]} numberOfLines={1}>{name}</Text>
        <Text style={type.caption}>{[item.cigar?.vitola, t('humidor.storedFor', { time: storedFor(item.acquired_on, t) })].filter(Boolean).join(' · ')}</Text>
      </View>
      <Pill label={ready ? t('humidor.ready') : t('humidor.restingDays', { days: item.rest_days - age })} tone={ready ? 'success' : 'warning'} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, minWidth: 40, textAlign: 'right' }}>×{item.quantity}</Text>
    </Pressable>
  );
}

function Metric({ value, label, accent, warn }: { value: string; label: string; accent?: boolean; warn?: boolean }) {
  return (
    <View style={{ minWidth: 90 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: warn ? colors.danger : accent ? colors.accent : colors.text }}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

