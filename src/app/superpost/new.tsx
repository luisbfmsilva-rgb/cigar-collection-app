import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ErrorText, Field, Loading, Pill, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { canSuperPost, createSuperPost, postedSuperToday } from '@/lib/api';
import { radius, space, type } from '@/lib/theme';
import { errorMessage, useAsync } from '@/lib/useAsync';

/** Publishes today's Super Post (influencers and manufacturers; one per day). */
export default function NewSuperPost() {
  const { t } = useI18n();
  const router = useRouter();
  const status = useAsync(async () => ({ allowed: await canSuperPost(), used: await postedSuperToday() }), []);
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled) setPhoto({ uri: res.assets[0].uri, mime: res.assets[0].mimeType ?? 'image/jpeg' });
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      await createSuperPost({ body, photoUri: photo?.uri, mime: photo?.mime });
      router.back();
    } catch (e) {
      const m = errorMessage(e);
      setError(m.includes('SUPER_POST_LIMIT') ? t('super.used') : m);
    } finally {
      setBusy(false);
    }
  }

  if (status.loading) return <Loading />;
  const blocked = !status.data?.allowed || status.data?.used;
  return (
    <Screen keyboard footer={<Button label={t('super.publish')} onPress={publish} loading={busy} disabled={blocked || body.trim().length < 1} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('super.title')}</Text>
        <Text style={type.body}>{t('super.explain')}</Text>
        {!status.data?.allowed ? <Pill label={t('super.notAllowed')} tone="warning" /> : status.data?.used ? <Pill label={t('super.used')} tone="warning" /> : null}
        <Field label={t('super.body')} value={body} onChangeText={setBody} multiline maxLength={500} />
        {photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 180, borderRadius: radius.md }} contentFit="cover" /> : null}
        <Button label={photo ? t('common.change') : t('super.addPhoto')} variant="secondary" onPress={pick} />
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
