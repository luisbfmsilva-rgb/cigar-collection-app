import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CigarRow } from '@/components/CigarRow';
import { Button, Chip, Empty, ErrorText, Field, IconButton, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { recentCigars, searchCigars, topCigars } from '@/lib/api';
import { colors, space, type } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

const COUNTRY_FILTERS = ['BR', 'NI', 'DO', 'HN', 'CU', 'CR', 'EC', 'MX'];

export default function Explore() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const { data: results, loading: searching, error } = useSearch(q, searchCigars);

  const top = useAsync(() => topCigars(country ?? undefined), [country]);
  const popular = useAsync(() => recentCigars(), []);


  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('tabs.explore')}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Field value={q} onChangeText={setQ} placeholder={t('explore.searchPlaceholder')} autoCorrect={false} returnKeyType="search" style={{ flex: 1 }} />
          <IconButton icon="barcode-outline" label={t('explore.scan')} onPress={() => router.push({ pathname: '/scan', params: { then: 'cigar' } })} filled />
        </View>
      </View>
      <Screen>
        <ErrorText message={error} />
        {results ? (
          <View style={{ gap: space.sm }}>
            {searching ? <ActivityIndicator color={colors.accent} /> : null}
            {results.map((c) => <CigarRow key={c.id} cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} />)}
            {!searching && results.length === 0 ? <Text style={[type.body, { color: colors.textMuted }]}>{t('explore.noResults', { q: q.trim() })}</Text> : null}
            <Button label={t('explore.addCigar')} variant="secondary" icon="add" onPress={() => router.push({ pathname: '/cigar/new', params: { q: q.trim() } })} style={{ marginTop: space.md }} />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label={t('explore.allCountries')} selected={!country} onPress={() => setCountry(null)} />
              {COUNTRY_FILTERS.map((c) => <Chip key={c} label={c} selected={country === c} onPress={() => setCountry(country === c ? null : c)} />)}
            </View>
            <SectionTitle title={t('explore.topRated')} />
            <View style={{ gap: space.sm }}>
              {(top.data ?? []).slice(0, 10).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} />)}
              {!top.loading && (top.data ?? []).length === 0 ? <Empty text={t('common.empty')} /> : null}
            </View>
            <SectionTitle title={t('explore.popular')} />
            <View style={{ gap: space.sm }}>
              {(popular.data ?? []).slice(0, 10).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} />)}
            </View>
            <SectionTitle title={t('explore.notFound')} />
            <Button label={t('explore.addCigar')} variant="secondary" icon="add" onPress={() => router.push('/cigar/new')} />
            <SectionTitle title={t('explore.clubs')} />
            <Button label={t('clubs.discover')} variant="secondary" icon="people-outline" onPress={() => router.push('/clubs')} />
          </>
        )}
      </Screen>
    </View>
  );
}
