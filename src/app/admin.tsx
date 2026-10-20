import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { CigarRow } from '@/components/CigarRow';
import { PersonRow } from '@/components/PersonRow';
import { Button, Card, Empty, ErrorText, Row, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { openReports, pendingCigars, pendingCreators, resolveReport, reviewCreator, setCigarApproved } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

type Tab = 'cigars' | 'creators' | 'reports';

export default function Admin() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const [tab, setTab] = useState<Tab>('cigars');
  const [error, setError] = useState<string | null>(null);
  const cigars = useAsync(() => pendingCigars(), []);
  const creators = useAsync(() => pendingCreators(), []);
  const reports = useAsync(() => openReports(), []);

  if (!me.is_admin) return <Screen><Empty text={t('common.error')} /></Screen>;

  async function run(fn: () => Promise<unknown>, reload: () => void) {
    setError(null);
    try {
      await fn();
      reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('admin.title')}</Text>
        <Segmented<Tab> value={tab} onChange={setTab} options={[
          { value: 'cigars', label: `${t('admin.cigars')} (${cigars.data?.length ?? 0})` },
          { value: 'creators', label: `${t('admin.creators')} (${creators.data?.length ?? 0})` },
          { value: 'reports', label: `${t('admin.reports')} (${reports.data?.length ?? 0})` },
        ]} />
        <ErrorText message={error} />

        {tab === 'cigars' ? (cigars.data ?? []).map((c) => (
          <View key={c.id} style={{ gap: 6 }}>
            <CigarRow cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} right={<></>} />
            <Row>
              <Button label={t('admin.approve')} small style={{ flex: 1 }} onPress={() => run(() => setCigarApproved(c.id, true), cigars.reload)} />
              <Button label={t('admin.reject')} small variant="secondary" style={{ flex: 1 }} onPress={() => run(() => setCigarApproved(c.id, false), cigars.reload)} />
            </Row>
          </View>
        )) : null}

        {tab === 'creators' ? (creators.data ?? []).map((a) => (
          <Card key={a.user_id} style={{ gap: space.sm }}>
            <PersonRow p={a.profile} onPress={() => router.push(`/user/${a.profile.username}`)} />
            <Text style={type.body} onPress={() => { const u = a.channels.match(/https:\/\/\S+/)?.[0]; if (u) Linking.openURL(u); }}>{a.channels}</Text>
            {a.audience ? <Text style={type.caption}>{a.audience}</Text> : null}
            {a.message ? <Text style={type.caption}>{a.message}</Text> : null}
            <Row>
              <Button label={t('admin.approve')} small style={{ flex: 1 }} onPress={() => run(() => reviewCreator(a.user_id, true), creators.reload)} />
              <Button label={t('admin.reject')} small variant="secondary" style={{ flex: 1 }} onPress={() => run(() => reviewCreator(a.user_id, false), creators.reload)} />
            </Row>
          </Card>
        )) : null}

        {tab === 'reports' ? (reports.data ?? []).map((r) => (
          <Card key={r.id} style={{ gap: space.sm }}>
            <Text style={type.label}>{r.target_kind} · {timeAgo(r.created_at, t)}</Text>
            <Text style={type.body}>{r.reason}</Text>
            {r.target_kind === 'checkin' ? <Button label={t('common.seeAll')} variant="ghost" small onPress={() => router.push(`/checkin/${r.target_id}`)} /> : null}
            <Row>
              <Button label={t('admin.removeContent')} small variant="danger" style={{ flex: 1 }} onPress={() => run(() => resolveReport(r, true), reports.reload)} />
              <Button label={t('admin.dismiss')} small variant="secondary" style={{ flex: 1 }} onPress={() => run(() => resolveReport(r, false), reports.reload)} />
            </Row>
          </Card>
        )) : null}

        {((tab === 'cigars' && !cigars.data?.length) || (tab === 'creators' && !creators.data?.length) || (tab === 'reports' && !reports.data?.length))
          ? <Empty text={t('admin.none')} icon="checkmark-done-outline" /> : null}
      </View>
    </Screen>
  );
}
