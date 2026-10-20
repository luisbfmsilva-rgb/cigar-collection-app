import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Field, Icon, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { createProfile, usernameAvailable } from '@/lib/api';
import { isAtLeast21, useAuth } from '@/lib/auth';
import { isoDate } from '@/lib/format';
import { prefs } from '@/lib/prefs';
import { colors, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function ProfileSetup() {
  const { t, locale } = useI18n();
  const { session, refreshProfile, signOut } = useAuth();
  const meta = session?.user.user_metadata as { full_name?: string; name?: string } | undefined;
  const [name, setName] = useState(prefs.get('suggested_name') ?? meta?.full_name ?? meta?.name ?? '');
  const [username, setUsername] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState(locale === 'pt' ? 'BR' : 'US');
  const [accepted, setAccepted] = useState(false);
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = username.trim().toLowerCase();
  const usernameOk = /^[a-z0-9_.]{3,24}$/.test(cleanUsername);

  useEffect(() => {
    if (!usernameOk) return;
    const id = setTimeout(() => usernameAvailable(cleanUsername).then((ok) => setTaken(!ok)).catch(() => {}), 350);
    return () => clearTimeout(id);
  }, [cleanUsername, usernameOk]);

  const d = Number(day), m = Number(month), y = Number(year);
  const date = new Date(y, m - 1, d);
  const dateValid = y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && date.getMonth() === m - 1;
  const oldEnough = dateValid && isAtLeast21(date);
  const canSubmit = name.trim().length > 0 && usernameOk && !taken && dateValid && oldEnough && accepted;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createProfile({
        username: cleanUsername, display_name: name.trim(), birthdate: isoDate(date),
        country: /^[A-Za-z]{2}$/.test(country.trim()) ? country.trim().toUpperCase() : null, locale,
      });
      await refreshProfile();
    } catch (e) {
      const msg = errorMessage(e);
      setError(msg.includes('AGE_RESTRICTED') ? t('profileSetup.underage') : msg.includes('duplicate') ? t('profileSetup.usernameTaken') : msg);
    } finally {
      setBusy(false);
    }
  }

  const dateFields = [
    <Field key="d" label={t('profileSetup.day')} value={day} onChangeText={(v) => setDay(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="DD" style={{ flex: 1 }} />,
    <Field key="m" label={t('profileSetup.month')} value={month} onChangeText={(v) => setMonth(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="MM" style={{ flex: 1 }} />,
  ];
  if (locale === 'en') dateFields.reverse();

  return (
    <Screen keyboard footer={<Button label={t('profileSetup.finish')} onPress={submit} loading={busy} disabled={!canSubmit} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg, paddingTop: space.xxl }}>
        <Text style={type.display} accessibilityRole="header">{t('profileSetup.title')}</Text>
        <Field label={t('profileSetup.displayName')} value={name} onChangeText={setName} maxLength={60} autoComplete="name" />
        <Field
          label={t('profileSetup.username')} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false}
          maxLength={24} hint={t('profileSetup.usernameHint')} error={taken ? t('profileSetup.usernameTaken') : null}
        />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('profileSetup.birthdate')}</Text>
          <Row gap={space.sm} style={{ alignItems: 'flex-start' }}>
            {dateFields}
            <Field label={t('profileSetup.year')} value={year} onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="YYYY" style={{ flex: 1.4 }} />
          </Row>
          <Text style={[type.caption, dateValid && !oldEnough && { color: colors.danger }]}>
            {dateValid && !oldEnough ? t('profileSetup.underage') : t('profileSetup.birthdateHint')}
          </Text>
        </View>
        <Field label={t('profileSetup.country')} value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} placeholder={t('common.countryPlaceholder')} />
        <Pressable
          onPress={() => setAccepted(!accepted)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}
          style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', minHeight: 44 }}
        >
          <Icon name={accepted ? 'checkbox' : 'square-outline'} color={accepted ? colors.accent : colors.textMuted} size={26} />
          <Text style={[type.body, { flex: 1 }]}>{t('profileSetup.acceptTerms')}</Text>
        </Pressable>
        <ErrorText message={error} />
        <Button label={t('auth.signOut')} variant="ghost" onPress={signOut} small />
      </View>
    </Screen>
  );
}
