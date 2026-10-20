import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorText } from '@/components/ui';
import { useI18n } from '@/i18n';
import { appleSignInAvailable, OAuthProvider, signInWithAppleNative, signInWithProvider } from '@/lib/auth';
import { prefs } from '@/lib/prefs';
import { colors, radius, space, type } from '@/lib/theme';
import { errorMessage } from '@/lib/useAsync';

export default function SignIn() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleNative, setAppleNative] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setAppleNative).catch(() => setAppleNative(false));
  }, []);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      const res = await fn();
      const name = (res as { suggestedName?: string | null } | undefined)?.suggestedName;
      if (name) prefs.set('suggested_name', name);
    } catch (e) {
      const msg = errorMessage(e);
      if (!/cancel/i.test(msg)) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  const oauth = (p: OAuthProvider) => run(p, () => signInWithProvider(p));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.xxl, paddingTop: insets.top + space.xxl * 2, paddingBottom: insets.bottom + space.xl, justifyContent: 'space-between' }}>
      <View style={{ gap: space.md }}>
        <Text style={[type.display, { fontSize: 44 }]} accessibilityRole="header">Long Ash</Text>
        <Text style={[type.body, { fontSize: 17 }]}>{t('ageGate.tagline')}</Text>
      </View>

      <View style={{ gap: space.md }}>
        {appleNative ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={radius.md}
            style={{ height: 52 }}
            onPress={() => run('apple', signInWithAppleNative)}
          />
        ) : Platform.OS !== 'android' ? (
          <Button label={t('auth.continueApple')} icon="logo-apple" variant="secondary" loading={busy === 'apple'} onPress={() => oauth('apple')} />
        ) : null}
        <Button label={t('auth.continueGoogle')} icon="logo-google" variant="secondary" loading={busy === 'google'} onPress={() => oauth('google')} />
        <Button label={t('auth.continueFacebook')} icon="logo-facebook" variant="secondary" loading={busy === 'facebook'} onPress={() => oauth('facebook')} />
        <Text style={[type.caption, { textAlign: 'center' }]}>{t('auth.or')}</Text>
        <Button label={t('auth.continueEmail')} icon="mail-outline" onPress={() => router.push('/email-auth')} />
        <ErrorText message={error} />
        <Text style={[type.caption, { textAlign: 'center' }]}>{t('auth.terms')}</Text>
      </View>
    </View>
  );
}
