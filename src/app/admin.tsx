import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { CigarRow } from '@/components/CigarRow';
import { PersonRow } from '@/components/PersonRow';
import { Button, Card, Chip, Empty, ErrorText, Field, Pill, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  AccountApplicationRow, brandsLike, openReports, pendingApplications, pendingCigars, pendingCreators, pendingSuggestions,
  resolveReport, reviewApplication, reviewCreator, reviewSuggestion, setCigarApproved, SuggestionRow,
} from '@/lib/api';
import { useMe } from '@/lib/auth';
import { cigarTitle, timeAgo } from '@/lib/format';
import { colors, fonts, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

type Tab = 'cigars' | 'edits' | 'accounts' | 'creators' | 'reports';

export default function Admin() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const [tab, setTab] = useState<Tab>('cigars');
  const [error, setError] = useState<string | null>(null);
  const cigars = useAsync(() => pendingCigars(), []);
  const edits = useAsync(() => pendingSuggestions(), []);
  const accounts = useAsync(() => pendingApplications(), []);
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

  const tabs: { value: Tab; label: string; n: number }[] = [
    { value: 'cigars', label: t('admin.cigars'), n: cigars.data?.length ?? 0 },
    { value: 'edits', label: t('admin.edits'), n: edits.data?.length ?? 0 },
    { value: 'accounts', label: t('admin.accounts'), n: accounts.data?.length ?? 0 },
    { value: 'creators', label: t('admin.creators'), n: creators.data?.length ?? 0 },
    { value: 'reports', label: t('admin.reports'), n: reports.data?.length ?? 0 },
  ];
  const empty = tabs.find((x) => x.value === tab)!.n === 0;

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('admin.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {tabs.map((x) => <Chip key={x.value} label={`${x.label} (${x.n})`} selected={tab === x.value} onPress={() => setTab(x.value)} />)}
        </ScrollView>
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

        {tab === 'edits' ? (edits.data ?? []).map((s) => (
          <SuggestionCard key={s.id} s={s}
            onApprove={() => run(() => reviewSuggestion(s.id, true), edits.reload)}
            onReject={() => run(() => reviewSuggestion(s.id, false), edits.reload)} />
        )) : null}

        {tab === 'accounts' ? (accounts.data ?? []).map((a) => (
          <ApplicationCard key={a.id} a={a}
            onApprove={(brandIds) => run(() => reviewApplication(a.id, true, brandIds), accounts.reload)}
            onReject={() => run(() => reviewApplication(a.id, false), accounts.reload)} />
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
            {r.target_kind === 'brand_article' ? <Button label={t('common.seeAll')} variant="ghost" small onPress={() => router.push(`/article/${r.target_id}`)} /> : null}
            <Row>
              <Button label={t('admin.removeContent')} small variant="danger" style={{ flex: 1 }} onPress={() => run(() => resolveReport(r, true), reports.reload)} />
              <Button label={t('admin.dismiss')} small variant="secondary" style={{ flex: 1 }} onPress={() => run(() => resolveReport(r, false), reports.reload)} />
            </Row>
          </Card>
        )) : null}

        {empty ? <Empty text={t('admin.none')} icon="checkmark-done-outline" /> : null}
      </View>
    </Screen>
  );
}

function SuggestionCard({ s, onApprove, onReject }: { s: SuggestionRow; onApprove: () => void; onReject: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const show = (v: unknown) => (v == null || v === '' ? '–' : Array.isArray(v) ? v.join(', ') || '–' : String(v));
  return (
    <Card style={{ gap: space.sm }}>
      {s.cigar ? <Text style={[type.label, { fontFamily: fonts.bold }]} onPress={() => router.push(`/cigar/${s.cigar_id}`)}>{cigarTitle(s.cigar)}</Text> : null}
      <Text style={type.caption}>{t('admin.by', { user: s.author?.username ?? '?' })} · {timeAgo(s.created_at, t)}</Text>
      {Object.entries(s.changes).map(([field, value]) => (
        <View key={field} style={{ gap: 2 }}>
          <Text style={type.overline}>{field}</Text>
          <Row>
            <Text style={[type.caption, { flex: 1, textDecorationLine: 'line-through' }]}>{show(s.cigar?.[field as keyof typeof s.cigar])}</Text>
            <Text style={[type.label, { flex: 1, color: colors.accent }]}>{show(value)}</Text>
          </Row>
        </View>
      ))}
      {s.note ? <Text style={type.caption}>{t('admin.reviewNote')}: {s.note}</Text> : null}
      <Row>
        <Button label={t('admin.approve')} small style={{ flex: 1 }} onPress={onApprove} />
        <Button label={t('admin.reject')} small variant="secondary" style={{ flex: 1 }} onPress={onReject} />
      </Row>
    </Card>
  );
}

function ApplicationCard({ a, onApprove, onReject }: { a: AccountApplicationRow; onApprove: (brandIds: string[]) => void; onReject: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(a.brand_names?.split(',')[0]?.trim() ?? '');
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const hints = useSearch(q, brandsLike, { minLength: 1, delay: 250 }).data ?? [];
  const isMaker = a.requested_type === 'manufacturer';
  const lines: [string, string | null][] = [
    [t('account.experience'), a.experience], [t('account.company'), a.company], [t('account.brandNames'), a.brand_names],
    [t('account.website'), a.website], [t('account.contact'), a.contact], [t('account.message'), a.message],
  ];
  return (
    <Card style={{ gap: space.sm }}>
      <PersonRow p={a.profile} onPress={() => router.push(`/user/${a.profile.username}`)}
        right={<Pill label={t(`account.types.${a.requested_type}`)} tone="accent" />} />
      {lines.filter(([, v]) => v).map(([label, v]) => (
        <View key={label}>
          <Text style={type.caption}>{label}</Text>
          <Text style={type.body}>{v}</Text>
        </View>
      ))}
      {isMaker ? (
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('admin.linkBrands')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {picked.map((b) => <Chip key={b.id} label={b.name} selected icon="close" onPress={() => setPicked(picked.filter((x) => x.id !== b.id))} />)}
          </View>
          <Field placeholder={t('admin.searchBrand')} value={q} onChangeText={setQ} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {hints.filter((h) => !picked.some((p) => p.id === h.id)).slice(0, 8).map((h) => (
              <Chip key={h.id} label={h.name} small onPress={() => setPicked([...picked, h])} />
            ))}
          </View>
        </View>
      ) : null}
      <Row>
        <Button label={t('admin.approve')} small style={{ flex: 1 }} disabled={isMaker && picked.length === 0} onPress={() => onApprove(picked.map((b) => b.id))} />
        <Button label={t('admin.reject')} small variant="secondary" style={{ flex: 1 }} onPress={onReject} />
      </Row>
    </Card>
  );
}
