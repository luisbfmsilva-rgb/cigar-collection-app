import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { applyAccountType } from '@/lib/api';
import { space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function ApplyAccountType() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const kind = params.type === 'manufacturer' ? 'manufacturer' : 'expert';
  const [experience, setExperience] = useState('');
  const [company, setCompany] = useState('');
  const [brandNames, setBrandNames] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = kind === 'expert'
    ? experience.trim().length >= 10
    : company.trim().length >= 2 && brandNames.trim().length >= 2 && contact.trim().length >= 5;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await applyAccountType({ requested_type: kind, experience, company, brand_names: brandNames, website, contact, message });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const typeName = t(`account.types.${kind}`);
  return (
    <Screen keyboard footer={<Button label={t('account.submit')} onPress={submit} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('account.applyTitle', { type: typeName })}</Text>
        <Text style={type.body}>{t(`account.descriptions.${kind}`)}</Text>
        <Text style={type.caption}>{t('account.applyIntro')}</Text>
        {kind === 'expert' ? (
          <Field label={t('account.experience')} value={experience} onChangeText={setExperience} multiline maxLength={1000} />
        ) : (
          <>
            <Card><Text style={type.caption}>{t('account.manufacturerNote')}</Text></Card>
            <Field label={t('account.company')} value={company} onChangeText={setCompany} maxLength={120} />
            <Field label={t('account.brandNames')} value={brandNames} onChangeText={setBrandNames} maxLength={300} placeholder="Le Cigar, Jamm…" />
            <Field label={t('account.website')} value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" maxLength={300} />
            <Field label={t('account.contact')} value={contact} onChangeText={setContact} autoCapitalize="none" maxLength={200} />
          </>
        )}
        <Field label={t('account.message')} value={message} onChangeText={setMessage} multiline maxLength={1000} />
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
