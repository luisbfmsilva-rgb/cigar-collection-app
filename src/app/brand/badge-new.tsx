import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Field, Icon, IconName, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createBrandBadge } from '@/lib/api';
import { colors, radius, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

const BADGE_ICONS: IconName[] = ['ribbon', 'trophy', 'medal', 'star', 'flame', 'diamond', 'heart', 'leaf', 'flash', 'shield-checkmark'];

export default function NewBrandBadge() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<IconName>('ribbon');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createBrandBadge({ brand_id: brandId, name, description, icon });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={submit} loading={busy} disabled={name.trim().length < 2} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('brand.newBadge')}</Text>
        <Field label={t('brand.badgeName')} value={name} onChangeText={setName} maxLength={40} />
        <Field label={t('brand.badgeDescription')} value={description} onChangeText={setDescription} maxLength={200} multiline />
        <Text style={type.label}>{t('brand.badgeIcon')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {BADGE_ICONS.map((i) => (
            <Pressable key={i} onPress={() => setIcon(i)} accessibilityRole="button" accessibilityLabel={i} accessibilityState={{ selected: icon === i }}
              style={{ width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: icon === i ? colors.accent : colors.chip }}>
              <Icon name={i} size={26} color={icon === i ? colors.onAccent : colors.gold} />
            </Pressable>
          ))}
        </View>
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
