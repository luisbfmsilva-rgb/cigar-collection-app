import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Chip, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { report, setBlock } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function Report() {
  const { kind, id, userId } = useLocalSearchParams<{ kind: string; id: string; userId?: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const { profile } = useAuth();
  const reasons = t.list('report.reasons');
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await report(kind, id, [reason, details.trim()].filter(Boolean).join(' — ').slice(0, 500));
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('report.title')}</Text>
        {sent ? (
          <>
            <Text style={[type.body, { color: colors.gold }]}>{t('report.sent')}</Text>
            {userId && userId !== profile?.id ? (
              <Button label={t('common.block')} variant="danger" onPress={() => Alert.alert(t('report.blockConfirm'), undefined, [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.block'), style: 'destructive', onPress: async () => { await setBlock(userId, true); router.dismissAll(); } },
              ])} />
            ) : null}
            <Button label={t('common.close')} variant="secondary" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {reasons.map((r) => <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />)}
            </View>
            <Field value={details} onChangeText={setDetails} placeholder={t('report.reasonPlaceholder')} multiline maxLength={400} />
            <ErrorText message={error} />
            <Button label={t('report.title')} onPress={submit} loading={busy} disabled={!reason && details.trim().length < 3} />
          </>
        )}
      </View>
    </Screen>
  );
}
