import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui';
import { LanguagePicker } from '@/components/LanguagePicker';
import { useI18n } from '@/i18n';
import { useAge } from '@/lib/age';
import { colors, space, type } from '@/lib/theme';

export default function AgeGate() {
  const { t } = useI18n();
  const { confirmAge } = useAge();
  const [refused, setRefused] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.xxl, paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl, justifyContent: 'space-between' }}>
      <LanguagePicker />
      <View style={{ gap: space.md }}>
        <Logo size={30} />
        <Text style={[type.display, { fontSize: 48 }]} accessibilityRole="header">{t('ageGate.title')}</Text>
        <Text style={[type.body, { fontSize: 17 }]}>{t('ageGate.tagline')}</Text>
      </View>
      <View style={{ gap: space.md }}>
        {refused ? (
          <Text style={[type.heading, { textAlign: 'center' }]} accessibilityLiveRegion="assertive">{t('ageGate.blocked')}</Text>
        ) : (
          <>
            <Text style={[type.heading, { textAlign: 'center', fontSize: 18 }]}>{t('ageGate.question')}</Text>
            <Button label={t('ageGate.yes')} onPress={confirmAge} />
            <Button label={t('ageGate.no')} variant="secondary" onPress={() => setRefused(true)} />
          </>
        )}
        <Text style={[type.caption, { textAlign: 'center' }]}>{t('ageGate.disclaimer')}</Text>
      </View>
    </View>
  );
}
