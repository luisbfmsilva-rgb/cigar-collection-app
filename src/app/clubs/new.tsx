import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Field, Icon, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createClub } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { colors, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function NewClub() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(me.city ?? '');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const id = await createClub({ name, description, city, country: me.country, privacy, avatarUri: avatar });
      router.replace(`/clubs/${id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard footer={<Button label={t('clubs.create')} onPress={create} loading={busy} disabled={name.trim().length < 3} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('clubs.create')}</Text>
        <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel={t('clubs.photo')} style={{ alignSelf: 'center' }}>
          {avatar ? <Image source={{ uri: avatar }} style={{ width: 96, height: 96, borderRadius: 24 }} /> : (
            <View style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera-outline" color={colors.textMuted} />
            </View>
          )}
        </Pressable>
        <Field label={t('clubs.name')} value={name} onChangeText={setName} maxLength={60} />
        <Field label={t('clubs.description')} value={description} onChangeText={setDescription} multiline maxLength={500} />
        <Field label={t('clubs.city')} value={city} onChangeText={setCity} />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('clubs.privacy')}</Text>
          <Segmented value={privacy} onChange={setPrivacy} options={[{ value: 'public', label: t('clubs.publicShort') }, { value: 'private', label: t('clubs.privateShort') }]} />
          <Text style={type.caption}>{privacy === 'public' ? t('clubs.public') : t('clubs.private')}</Text>
        </View>
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
