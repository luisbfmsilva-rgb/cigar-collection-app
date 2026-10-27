import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { space, type } from '@/lib/theme';
import { COFFEE, CoffeeChoice, CoffeeOption, coffeeName } from '@/lib/coffee';
import { PAIRING_KINDS, PairingKind } from '@/lib/types';

const SUGGESTIONS: Partial<Record<PairingKind, string[]>> = {
  spirit: ['Bourbon', 'Rye', 'Scotch', 'Rum', 'Cognac', 'Tequila', 'Cachaça', 'Mezcal'],
  wine: ['Port', 'Cabernet Sauvignon', 'Malbec', 'Sherry'],
  beer: ['Stout', 'Porter', 'IPA', 'Amber ale'],
  non_alcoholic: ['Water', 'Sparkling water', 'Ginger ale', 'Tea'],
  food: ['Dark chocolate', 'Cheese', 'Steak', 'Nuts'],
};

export default function PairingPicker() {
  const { t, s, locale } = useI18n();
  const router = useRouter();
  const { draft, update } = useCheckinDraft();
  const [kind, setKind] = useState<PairingKind>('spirit');
  const [name, setName] = useState('');
  const [coffee, setCoffee] = useState<CoffeeChoice>({ drink: null, method: null, roast: null, origin: null, extras: [], brand: '' });
  const isCoffee = kind === 'coffee';
  const finalName = isCoffee ? (coffee.drink || name.trim() ? [coffeeName(coffee, locale), name.trim()].filter(Boolean).join(' · ') : '') : name.trim();

  function add(value = finalName) {
    const v = value.trim();
    if (!v) return;
    update({ pairings: [...draft.pairings, { kind, name: v.slice(0, 140) }] });
    router.back();
  }

  return (
    <Screen keyboard footer={<Button label={t('common.add')} onPress={() => add()} disabled={!finalName} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('pairing.title')}</Text>
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('pairing.kind')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PAIRING_KINDS.map((k) => <Chip key={k} label={s.pairing.kinds[k]} selected={kind === k} onPress={() => setKind(k)} />)}
          </View>
        </View>
        {isCoffee ? (
          <>
            <Group title={t('pairing.coffee.drink')} options={COFFEE.drink} locale={locale} selected={coffee.drink ? [coffee.drink] : []}
              onPick={(c) => setCoffee({ ...coffee, drink: coffee.drink === c ? null : c })} />
            <Group title={t('pairing.coffee.method')} options={COFFEE.method} locale={locale} selected={coffee.method ? [coffee.method] : []}
              onPick={(c) => setCoffee({ ...coffee, method: coffee.method === c ? null : c })} />
            <Group title={t('pairing.coffee.roast')} options={COFFEE.roast} locale={locale} selected={coffee.roast ? [coffee.roast] : []}
              onPick={(c) => setCoffee({ ...coffee, roast: coffee.roast === c ? null : c })} />
            <Group title={t('pairing.coffee.extras')} options={COFFEE.extras} locale={locale} selected={coffee.extras}
              onPick={(c) => setCoffee({ ...coffee, extras: coffee.extras.includes(c) ? coffee.extras.filter((x) => x !== c) : [...coffee.extras, c] })} />
            <Group title={t('pairing.coffee.origin')} options={COFFEE.origin} locale={locale} selected={coffee.origin ? [coffee.origin] : []}
              onPick={(c) => setCoffee({ ...coffee, origin: coffee.origin === c ? null : c })} />
            <Field label={t('pairing.coffee.brand')} value={name} onChangeText={setName} placeholder={t('pairing.coffee.brandPlaceholder')} maxLength={50} />
            {finalName ? <Text style={type.caption}>{finalName}</Text> : null}
          </>
        ) : (
          <Field label={t('pairing.name')} value={name} onChangeText={setName} placeholder={t('pairing.namePlaceholder')} autoFocus onSubmitEditing={() => add()} returnKeyType="done" maxLength={80} />
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(isCoffee ? [] : SUGGESTIONS[kind] ?? []).map((x) => <Chip key={x} label={x} onPress={() => setName(name.trim() ? `${x}, ${name.trim()}` : x)} />)}
        </View>
      </View>
    </Screen>
  );
}

function Group({ title, options, selected, onPick, locale }: {
  title: string; options: CoffeeOption[]; selected: string[]; onPick: (code: string) => void; locale: 'en' | 'pt' | 'es';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.label}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => <Chip key={o.code} label={o.label[locale]} selected={selected.includes(o.code)} onPress={() => onPick(o.code)} />)}
      </View>
    </View>
  );
}
