import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlavorWheel } from '@/components/FlavorWheel';
import { Bar, Button, Card, Chip, Field, Icon, IconButton, Row, Screen, SectionTitle, Segmented } from '@/components/ui';
import { localized, useI18n } from '@/i18n';
import { reviewTotal, SCORE_MAX, useCheckinDraft } from '@/lib/checkinDraft';
import { useFlavors } from '@/lib/flavors';
import { scoreToRating } from '@/lib/format';
import { colors, fonts, space, type } from '@/lib/theme';

const CRITERIA = ['appearance', 'draw', 'burn', 'flavor', 'aroma', 'overall'] as const;

export default function FullReview() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { draft, update } = useCheckinDraft();
  const ref = useFlavors();
  const [third, setThird] = useState(1);
  const [family, setFamily] = useState<string | null>(null);
  const thirds = t.list('review.thirds');

  const picksHere = draft.flavors.filter((f) => f.third === third);
  const activeFamilies = new Set(picksHere.map((p) => ref?.byCode.get(p.note)?.family).filter(Boolean) as string[]);
  const total = reviewTotal(draft.scores);

  /** Tap a note to add it (medium) or remove it; the strength is then chosen explicitly in the list below. */
  function toggleNote(code: string) {
    const existing = draft.flavors.find((f) => f.third === third && f.note === code);
    update({ flavors: existing ? draft.flavors.filter((f) => f !== existing) : [...draft.flavors, { third, note: code, intensity: 2 }] });
  }

  function setIntensity(code: string, intensity: number) {
    update({ flavors: draft.flavors.map((f) => (f.third === third && f.note === code ? { ...f, intensity } : f)) });
  }

  function setScore(k: (typeof CRITERIA)[number], v: number) {
    update({ scores: { ...draft.scores, [k]: Math.max(0, Math.min(SCORE_MAX[k], v)) } });
  }

  function finish() {
    if (total != null && draft.rating == null) update({ rating: scoreToRating(total) });
    router.back();
  }

  const familyNotes = family && ref ? ref.notes.filter((n) => n.family === family) : [];

  return (
    <Screen footer={<Button label={t('review.finish')} onPress={finish} style={{ flex: 1 }} />}>
      <View style={{ gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.display} accessibilityRole="header">{t('review.title')}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 28, color: colors.accent }}>{total ?? '–'}</Text>
            <Text style={type.caption}>{t('review.outOf100')}</Text>
          </View>
        </Row>

        <SectionTitle title={t('review.flavors')} />
        <Segmented<string>
          value={String(third)} onChange={(v) => setThird(Number(v))}
          options={[1, 2, 3, 0].map((n) => ({ value: String(n), label: thirds[n] ?? String(n) }))}
        />
        {ref ? (
          <FlavorWheel families={ref.families} activeFamilies={activeFamilies} selected={family} onSelect={setFamily} size={230} />
        ) : null}
        {family ? (
          <Card style={{ gap: space.sm }}>
            <Text style={type.caption}>{t('review.intensityHint')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {familyNotes.map((n) => {
                const pick = picksHere.find((p) => p.note === n.code);
                return (
                  <Chip key={n.code} selected={!!pick} color={ref?.familyByCode.get(n.family)?.color}
                    label={localized(n, locale)} onPress={() => toggleNote(n.code)} />
                );
              })}
            </View>
          </Card>
        ) : <Text style={type.caption}>{t('review.tapFamily')}</Text>}

        {picksHere.length > 0 ? (
          <Card style={{ gap: space.md }}>
            <Text style={type.label}>{t('review.picked')}</Text>
            {picksHere.map((p) => {
              const n = ref?.byCode.get(p.note);
              return (
                <View key={p.note} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[type.label, { color: n ? ref?.familyByCode.get(n.family)?.color : undefined }]}>{n ? localized(n, locale) : p.note}</Text>
                    <Pressable onPress={() => toggleNote(p.note)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.remove')}>
                      <Icon name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  </Row>
                  <Segmented<string>
                    value={String(p.intensity)} onChange={(v) => setIntensity(p.note, Number(v))}
                    options={[{ value: '1', label: `• ${t('review.light')}` }, { value: '2', label: `•• ${t('review.medium')}` }, { value: '3', label: `••• ${t('review.strong')}` }]}
                  />
                </View>
              );
            })}
          </Card>
        ) : null}

        <SectionTitle title={t('review.scores')} />
        <View style={{ gap: space.md }}>
          {CRITERIA.map((k) => {
            const v = draft.scores[k];
            return (
              <View key={k} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={[type.label, { flex: 1 }]}>{t(`review.criteria.${k}`)}</Text>
                  <IconButton icon="remove" label={`${t(`review.criteria.${k}`)} −1`} filled onPress={() => setScore(k, (v ?? Math.round(SCORE_MAX[k] * 0.8)) - 1)} />
                  <Text style={{ fontFamily: fonts.bold, color: v == null ? colors.textMuted : colors.text, fontSize: 16, minWidth: 64, textAlign: 'center' }}>
                    {v ?? '–'} / {SCORE_MAX[k]}
                  </Text>
                  <IconButton icon="add" label={`${t(`review.criteria.${k}`)} +1`} filled onPress={() => setScore(k, (v ?? Math.round(SCORE_MAX[k] * 0.8)) + 1)} />
                </Row>
                <Bar value={v ?? 0} max={SCORE_MAX[k]} />
              </View>
            );
          })}
        </View>

        <SectionTitle title={`${t('review.strength')} · ${t('review.body')}`} />
        <Level label={t('review.strength')} value={draft.strength} onChange={(strength) => update({ strength })} />
        <Level label={t('review.body')} value={draft.body} onChange={(body) => update({ body })} />
        <Field
          label={t('review.duration')} keyboardType="number-pad" value={draft.duration ? String(draft.duration) : ''}
          onChangeText={(v) => update({ duration: v ? Math.min(600, Number(v.replace(/\D/g, '')) || 0) || null : null })}
        />
      </View>
    </Screen>
  );
}

function Level({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  const { t } = useI18n();
  const levels = t.list('review.levels');
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.caption}>{label}{value ? ` · ${levels[value - 1]}` : ''}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => onChange(value === n ? null : n)} accessibilityRole="button" accessibilityLabel={`${label} ${levels[n - 1]}`} accessibilityState={{ selected: value === n }}
            style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: value != null && n <= value ? colors.accent : colors.surface, borderWidth: 1, borderColor: colors.border }} />
        ))}
      </View>
    </View>
  );
}
