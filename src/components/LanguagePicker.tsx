import { View } from 'react-native';
import { Chip } from '@/components/ui';
import { LOCALES, useI18n } from '@/i18n';
import { prefs } from '@/lib/prefs';

/** EN / PT / ES switch. Saves the choice on the device; the settings screen also saves it to the profile. */
export function LanguagePicker({ onChange }: { onChange?: (code: 'en' | 'pt' | 'es') => void }) {
  const { locale, setLocale } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {LOCALES.map((l) => (
        <Chip
          key={l.code}
          label={l.label}
          selected={l.code === locale}
          onPress={() => {
            setLocale(l.code);
            prefs.set('locale', l.code);
            onChange?.(l.code);
          }}
        />
      ))}
    </View>
  );
}
