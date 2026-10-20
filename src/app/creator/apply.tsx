import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { applyCreator } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function ApplyCreator() {
  const { t } = useI18n();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [channels, setChannels] = useState('');
  const [audience, setAudience] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await applyCreator({ channels, audience, message });
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard footer={<Button label={t('creator.submit')} onPress={submit} loading={busy} disabled={channels.trim().length < 5} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('creator.applyTitle')}</Text>
        <Text style={type.body}>{t('creator.applyIntro')}</Text>
        <Card><Text style={type.caption}>{t('creator.rules')}</Text></Card>
        <Field label={t('creator.channels')} value={channels} onChangeText={setChannels} multiline placeholder="https://youtube.com/@…" autoCapitalize="none" maxLength={1000} />
        <Field label={t('creator.audience')} value={audience} onChangeText={setAudience} maxLength={500} />
        <Field label={t('creator.message')} value={message} onChangeText={setMessage} multiline maxLength={1000} />
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
