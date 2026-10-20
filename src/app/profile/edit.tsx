import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Button, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { updateProfile, uploadImage } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function EditProfile() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(me.display_name);
  const [bio, setBio] = useState(me.bio ?? '');
  const [city, setCity] = useState(me.city ?? '');
  const [country, setCountry] = useState(me.country ?? '');
  const [headline, setHeadline] = useState(me.creator_headline ?? '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const avatar_url = avatar ? await uploadImage('avatars', avatar) : undefined;
      await updateProfile({
        display_name: name.trim(), bio: bio.trim() || null, city: city.trim() || null,
        country: /^[A-Za-z]{2}$/.test(country.trim()) ? country.trim().toUpperCase() : null,
        ...(me.creator_status === 'verified' ? { creator_headline: headline.trim() || null } : {}),
        ...(avatar_url ? { avatar_url } : {}),
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={save} loading={busy} disabled={!name.trim()} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel={t('profile.avatar')} style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={name || me.display_name} url={avatar ?? publicUrl('avatars', me.avatar_url)} size={96} seed={me.id} />
          <Text style={{ color: colors.accent, fontFamily: fonts.bold }}>{t('profile.avatar')}</Text>
        </Pressable>
        <Field label={t('profileSetup.displayName')} value={name} onChangeText={setName} maxLength={60} />
        <Field label={t('profile.bio')} value={bio} onChangeText={setBio} multiline maxLength={300} />
        <Field label={t('profile.city')} value={city} onChangeText={setCity} />
        <Field label={t('profileSetup.country')} value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} placeholder={t('common.countryPlaceholder')} />
        {me.creator_status === 'verified' ? <Field label={t('creator.headline')} value={headline} onChangeText={setHeadline} maxLength={80} /> : null}
        <ErrorText message={error} />
        <Text style={type.caption}>@{me.username}</Text>
      </View>
    </Screen>
  );
}
