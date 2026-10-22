import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Empty, ErrorText, Field, Icon, Pill, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { awardBrandBadge, badgeHolders, brandBadges } from '@/lib/api';
import { colors, radius, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

/** A manufacturer gives one of the brand's badges to a fan. */
export default function AwardBadge() {
  const { brandId, userId, name } = useLocalSearchParams<{ brandId: string; userId: string; name: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const data = useAsync(async () => {
    const list = await brandBadges(brandId);
    const holders = await badgeHolders(list.map((b) => b.id));
    return { list, has: new Set(holders.filter((h) => h.user_id === userId).map((h) => h.badge_id)) };
  }, [brandId, userId]);
  const [picked, setPicked] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      await awardBrandBadge(picked, userId, message);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const list = data.data?.list ?? [];
  return (
    <Screen keyboard footer={<Button label={t('brand.award')} onPress={submit} loading={busy} disabled={!picked} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('brand.awardTitle', { name })}</Text>
        {!data.loading && list.length === 0 ? (
          <>
            <Empty text={t('brand.createBadgeFirst')} icon="ribbon-outline" />
            <Button label={t('brand.newBadge')} onPress={() => router.replace({ pathname: '/brand/badge-new', params: { brandId } })} />
          </>
        ) : null}
        {list.map((b) => {
          const has = data.data?.has.has(b.id);
          return (
            <Pressable key={b.id} disabled={has} onPress={() => setPicked(b.id)} accessibilityRole="button" accessibilityState={{ selected: picked === b.id, disabled: has }}
              style={{ padding: space.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: picked === b.id ? colors.accent : colors.border,
                backgroundColor: colors.surface, opacity: has ? 0.5 : 1 }}>
              <Row gap={space.md}>
                <Icon name={(b.icon as never) ?? 'ribbon'} size={28} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={type.label}>{b.name}</Text>
                  {b.description ? <Text style={type.caption}>{b.description}</Text> : null}
                </View>
                {has ? <Pill label={t('brand.has')} /> : null}
              </Row>
            </Pressable>
          );
        })}
        {list.length > 0 ? <Field label={t('brand.awardMessage')} value={message} onChangeText={setMessage} maxLength={200} /> : null}
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
