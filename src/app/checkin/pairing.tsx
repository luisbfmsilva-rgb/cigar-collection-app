import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { space, type } from '@/lib/theme';
import { PAIRING_KINDS, PairingKind } from '@/lib/types';

const SUGGESTIONS: Partial<Record<PairingKind, string[]>> = {
  spirit: ['Bourbon', 'Rye', 'Scotch', 'Rum', 'Cognac', 'Tequila', 'Cachaça', 'Mezcal'],
  wine: ['Port', 'Cabernet Sauvignon', 'Malbec', 'Sherry'],
  beer: ['Stout', 'Porter', 'IPA', 'Amber ale'],
  coffee: ['Espresso', 'Cappuccino', 'Cold brew'],
  non_alcoholic: ['Water', 'Sparkling water', 'Ginger ale', 'Tea'],
  food: ['Dark chocolate', 'Cheese', 'Steak', 'Nuts'],
};

export default function PairingPicker() {
  const { t, s } = useI18n();
  const router = useRouter();
  const { draft, update } = useCheckinDraft();
  const [kind, setKind] = useState<PairingKind>('spirit');
  const [name, setName] = useState('');

  function add(value = name) {
    const v = value.trim();
    if (!v) return;
    update({ pairings: [...draft.pairings, { kind, name: v.slice(0, 80) }] });
    router.back();
  }

  return (
    <Screen keyboard footer={<Button label={t('common.add')} onPress={() => add()} disabled={!name.trim()} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('pairing.title')}</Text>
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('pairing.kind')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PAIRING_KINDS.map((k) => <Chip key={k} label={s.pairing.kinds[k]} selected={kind === k} onPress={() => setKind(k)} />)}
          </View>
        </View>
        <Field label={t('pairing.name')} value={name} onChangeText={setName} placeholder={t('pairing.namePlaceholder')} autoFocus onSubmitEditing={() => add()} returnKeyType="done" maxLength={80} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(SUGGESTIONS[kind] ?? []).map((x) => <Chip key={x} label={x} onPress={() => setName(name.trim() ? `${x}, ${name.trim()}` : x)} />)}
        </View>
      </View>
    </Screen>
  );
}
