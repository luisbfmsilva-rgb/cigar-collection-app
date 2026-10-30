import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { Avatar, Button, Chip, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addFanBrand, brandsLike, fanBrands, FanBrand, removeFanBrand, updateProfile, uploadImage } from '@/lib/api';
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
  const [fans, setFans] = useState<FanBrand[]>([]);
  const [brandQ, setBrandQ] = useState('');
  const [hits, setHits] = useState<FanBrand[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fanBrands(me.id).then(setFans).catch(() => null); }, [me.id]);
  useEffect(() => {
    if (!brandQ.trim()) { setHits([]); return; }
    const h = setTimeout(() => brandsLike(brandQ).then(setHits).catch(() => null), 250);
    return () => clearTimeout(h);
  }, [brandQ]);
  async function addFan(b: FanBrand) {
    if (fans.length >= 8 || fans.some((f) => f.id === b.id)) return;
    setFans([...fans, b]); setBrandQ('');
    await addFanBrand(b.id).catch((e) => { setFans((l) => l.filter((f) => f.id !== b.id)); setError(errorMessage(e)); });
  }
  async function dropFan(b: FanBrand) {
    setFans((l) => l.filter((f) => f.id !== b.id));
    await removeFanBrand(b.id).catch(() => null);
  }
  const [error, setError] = useState<string | null>(null);

  async function fromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  }
  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, cameraType: ImagePicker.CameraType.front });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  }
  function pick() {
    if (Platform.OS === 'web') return fromLibrary();
    Alert.alert(t('profile.avatar'), undefined, [
      { text: t('checkin.takePhoto'), onPress: fromCamera },
      { text: t('checkin.fromLibrary'), onPress: fromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
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
        <View style={{ gap: 8 }}>
          <Text style={type.label}>{t('fan.title')}</Text>
          <Text style={type.caption}>{t('fan.hint')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {fans.map((b) => <Chip key={b.id} selected label={`${t('fan.badge', { brand: b.name })}  ✕`} onPress={() => dropFan(b)} />)}
          </View>
          {fans.length < 8 ? <Field placeholder={t('fan.search')} value={brandQ} onChangeText={setBrandQ} /> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {hits.filter((h) => !fans.some((f) => f.id === h.id)).map((b) => <Chip key={b.id} label={b.name} onPress={() => addFan(b)} />)}
          </View>
        </View>
        <ErrorText message={error} />
        <Text style={type.caption}>@{me.username}</Text>
      </View>
    </Screen>
  );
}
