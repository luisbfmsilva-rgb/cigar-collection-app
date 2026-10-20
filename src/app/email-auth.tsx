import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { sendPasswordReset, signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { colors, fonts, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function EmailAuth() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 8;

  async function submit() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signIn') await signInWithEmail(email, password);
      else {
        const { needsConfirmation } = await signUpWithEmail(email, password);
        if (needsConfirmation) {
          setInfo(t('auth.confirmEmail'));
          setMode('signIn');
        }
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!validEmail) return;
    try {
      await sendPasswordReset(email);
      setInfo(t('auth.resetSent'));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</Text>
        <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field
          label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
          hint={mode === 'signUp' ? t('auth.passwordHint') : undefined}
        />
        {info ? <Text style={[type.body, { color: colors.gold }]} accessibilityLiveRegion="polite">{info}</Text> : null}
        <ErrorText message={error} />
        <Button label={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')} onPress={submit} loading={busy} disabled={!validEmail || !validPassword} />
        <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: colors.accent, fontFamily: fonts.bold, textAlign: 'center' }}>
            {mode === 'signIn' ? t('auth.noAccount') : t('auth.haveAccount')}
          </Text>
        </Pressable>
        {mode === 'signIn' ? (
          <Pressable onPress={reset} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.medium, textAlign: 'center' }}>{t('auth.forgot')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
