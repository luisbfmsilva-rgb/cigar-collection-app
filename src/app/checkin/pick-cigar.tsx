import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { CigarRow } from '@/components/CigarRow';
import { Button, Field, IconButton, Row, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { feed, searchCigars } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, space, type } from '@/lib/theme';
import type { Cigar } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

export default function PickCigar() {
  const { t } = useI18n();
  const router = useRouter();
  const { profile } = useAuth();
  const { update } = useCheckinDraft();
  const [q, setQ] = useState('');
  const { data: results, loading: searching } = useSearch(q, searchCigars);

  const recent = useAsync(async () => {
    if (!profile) return [];
    const rows = await feed({ kind: 'user', userId: profile.id });
    const seen = new Set<string>();
    return rows.filter((r) => (seen.has(r.cigar_id) ? false : (seen.add(r.cigar_id), true))).slice(0, 8);
  }, [profile?.id]);


  function choose(c: Pick<Cigar, 'id' | 'brand_name' | 'line' | 'vitola' | 'wrapper_shade'>) {
    update({ cigar: c });
    router.replace('/checkin/new');
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('checkin.pickCigar')}</Text>
        <Row>
          <Field value={q} onChangeText={setQ} placeholder={t('explore.searchPlaceholder')} autoFocus autoCorrect={false} style={{ flex: 1 }} />
          <IconButton icon="barcode-outline" label={t('explore.scan')} filled onPress={() => router.replace({ pathname: '/scan', params: { then: 'checkin' } })} />
        </Row>
        {searching ? <ActivityIndicator color={colors.accent} /> : null}
        {results ? (
          <View style={{ gap: space.sm }}>
            {results.map((c) => <CigarRow key={c.id} cigar={c} onPress={() => choose(c)} />)}
            {results.length === 0 && !searching ? <Text style={[type.body, { color: colors.textMuted }]}>{t('explore.noResults', { q: q.trim() })}</Text> : null}
            <Button label={t('explore.addCigar')} variant="secondary" icon="add" onPress={() => router.push({ pathname: '/cigar/new', params: { q: q.trim(), forCheckin: '1' } })} />
          </View>
        ) : (recent.data ?? []).length > 0 ? (
          <>
            <SectionTitle title={t('checkin.smokedRecently')} />
            <View style={{ gap: space.sm }}>
              {recent.data!.map((r) => (
                <CigarRow
                  key={r.cigar_id}
                  cigar={{
                    id: r.cigar_id, brand_name: r.brand_name, line: r.cigar_line, vitola: r.cigar_vitola, wrapper_shade: r.wrapper_shade,
                    country: r.cigar_country, ring_gauge: r.ring_gauge, length_in: r.length_in, rating_count: 0, avg_rating: null,
                    image_url: null,
                  } as Cigar}
                  onPress={() => choose({ id: r.cigar_id, brand_name: r.brand_name, line: r.cigar_line, vitola: r.cigar_vitola, wrapper_shade: r.wrapper_shade })}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
