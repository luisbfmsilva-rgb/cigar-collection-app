import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, ErrorText, Icon, IconName, Pill, Row, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { cancelApplication, myApplications, myBrands } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { colors, fonts, space, type } from '@/lib/theme';
import type { AccountType } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

const TYPES: { type: AccountType; icon: IconName }[] = [
  { type: 'aficionado', icon: 'leaf-outline' },
  { type: 'expert', icon: 'school-outline' },
  { type: 'manufacturer', icon: 'business-outline' },
];

/** Shows the three account types, the user's current one and any pending request. */
export default function AccountTypeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const apps = useAsync(() => myApplications(), []);
  const brands = useAsync(() => (me.account_type === 'manufacturer' ? myBrands() : Promise.resolve([])), [me.account_type]);
  const [error, setError] = useState<string | null>(null);

  const pending = (apps.data ?? []).find((a) => a.status === 'pending');
  const lastRejected = !pending && apps.data?.[0]?.status === 'rejected';
  const typeName = (x: AccountType) => t(`account.types.${x}`);

  async function cancel(id: string) {
    setError(null);
    try {
      await cancelApplication(id);
      apps.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('account.title')}</Text>
        <Text style={type.body}>{t('account.current', { type: typeName(me.account_type) })}</Text>

        {pending ? (
          <Card style={{ gap: space.sm, borderColor: colors.warning }}>
            <Text style={type.body}>{t('account.pending', { type: typeName(pending.requested_type) })}</Text>
            <Button label={t('account.cancel')} variant="secondary" small onPress={() => cancel(pending.id)} />
          </Card>
        ) : null}
        {lastRejected ? <Text style={type.caption}>{t('account.rejected')}</Text> : null}
        <ErrorText message={error} />

        {TYPES.map(({ type: x, icon }) => {
          const current = me.account_type === x;
          const canApply = !current && !pending && x !== 'aficionado'
            && !(x === 'expert' && me.account_type === 'manufacturer');
          return (
            <Card key={x} style={{ gap: space.sm, borderColor: current ? colors.accent : colors.border }}>
              <Row gap={space.md}>
                <Icon name={icon} size={24} color={current ? colors.accent : colors.text} />
                <Text style={[type.title, { flex: 1, fontSize: 18 }]}>{typeName(x)}</Text>
                {current ? <Pill label="✓" tone="accent" /> : null}
              </Row>
              <Text style={type.body}>{t(`account.descriptions.${x}`)}</Text>
              {canApply ? (
                <Button label={t('account.apply', { type: typeName(x) })} variant="secondary" small
                  onPress={() => router.push({ pathname: '/account/apply', params: { type: x } })} />
              ) : null}
            </Card>
          );
        })}

        {me.account_type === 'manufacturer' ? (
          <>
            <SectionTitle title={t('account.myBrands')} />
            {(brands.data ?? []).map(({ brand }) => (
              <Card key={brand.id} onPress={() => router.push(`/brand/${brand.id}`)}>
                <Row>
                  <Text style={[type.label, { flex: 1, fontFamily: fonts.bold }]}>{brand.name}</Text>
                  <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                </Row>
              </Card>
            ))}
          </>
        ) : null}

        <Text style={[type.caption, { marginTop: space.md }]}>{t('account.influencerNote')}</Text>
        {me.creator_status === 'none' || me.creator_status === 'rejected' ? (
          <Button label={t('profile.applyCreator')} variant="ghost" small onPress={() => router.push('/creator/apply')} style={{ alignSelf: 'flex-start' }} />
        ) : null}
      </View>
    </Screen>
  );
}
