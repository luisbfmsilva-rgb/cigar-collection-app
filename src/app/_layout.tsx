import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display/400Regular';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { registerForPush } from '@/lib/push';
import { Logo } from '@/components/Logo';
import { setupNotifications } from '@/lib/boveda';

setupNotifications();
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import { Loading } from '@/components/ui';
import { I18nProvider, Locale, useI18n } from '@/i18n';
import { AgeProvider, useAge } from '@/lib/age';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CheckinDraftProvider } from '@/lib/checkinDraft';
import { prefs } from '@/lib/prefs';
import { isConfigured } from '@/lib/supabase';
import { colors, fonts, space, type } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgDeep, text: colors.text, border: colors.border, primary: colors.accent },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSerifDisplay: DMSerifDisplay_400Regular,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  const savedLocale = prefs.get('locale') as Locale | null;
  return (
    <ThemeProvider value={navTheme}>
      <I18nProvider initial={savedLocale ?? undefined}>
        <AgeProvider>
          <AuthProvider>
            <CheckinDraftProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </CheckinDraftProvider>
          </AuthProvider>
        </AgeProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { ready, session, profile, needsProfile } = useAuth();
  const { ageConfirmed } = useAge();
  const { setLocale, locale } = useI18n();
  const router = useRouter();

  // Push notifications: register this device, and open the post when a notification is tapped.
  useEffect(() => {
    if (profile?.id) registerForPush(profile.id);
  }, [profile?.id]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = (r.notification.request.content.data as { url?: string } | undefined)?.url;
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, [router]);

  // Follow the language saved on the profile.
  useEffect(() => {
    if (profile?.locale && profile.locale !== locale) setLocale(profile.locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.locale]);

  if (!isConfigured) return <NotConfigured />;
  if (!ready) return <Loading />;

  const signedIn = !!session && !!profile;
  // Where each state belongs. Every protected group redirects here, so a screen that becomes
  // off-limits (e.g. sign-in right after an account is created) never bounces between guards.
  const home = !ageConfirmed ? '/age-gate' : !session ? '/sign-in' : needsProfile ? '/profile-setup' : '/';
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgDeep },
        headerTransparent: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
        headerBackTitleStyle: { fontFamily: fonts.medium },
        contentStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={!ageConfirmed} redirectTo={home}>
        <Stack.Screen name="age-gate" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={ageConfirmed && !session} redirectTo={home}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="email-auth" options={{ title: '' }} />
      </Stack.Protected>

      <Stack.Protected guard={ageConfirmed && !!session && needsProfile} redirectTo={home}>
        <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={ageConfirmed && signedIn} redirectTo={home}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="checkin/new" options={{ title: '' }} />
        <Stack.Screen name="checkin/pick-cigar" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="checkin/place" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="checkin/music" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="checkin/pairing" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="checkin/review" options={{ title: '' }} />
        <Stack.Screen name="checkin/[id]" options={{ title: '' }} />
        <Stack.Screen name="cigar/[id]" options={{ title: '' }} />
        <Stack.Screen name="cigar/new" options={{ title: '' }} />
        <Stack.Screen name="cigar/edit" options={{ title: '' }} />
        <Stack.Screen name="brand/[id]" options={{ title: '' }} />
        <Stack.Screen name="brand/article" options={{ title: '' }} />
        <Stack.Screen name="superpost/new" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="brand/badge-new" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="brand/award" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="article/[id]" options={{ title: '' }} />
        <Stack.Screen name="account/index" options={{ title: '' }} />
        <Stack.Screen name="account/apply" options={{ title: '' }} />
        <Stack.Screen name="scan" options={{ title: '', presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="user/[username]" options={{ title: '' }} />
        <Stack.Screen name="clubs/index" options={{ title: '' }} />
        <Stack.Screen name="clubs/new" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="clubs/[id]" options={{ title: '' }} />
        <Stack.Screen name="clubs/invite" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="humidor/new" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="humidor/add" options={{ title: '' }} />
        <Stack.Screen name="humidor/reading" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="humidor/item" options={{ title: '' }} />
        <Stack.Screen name="humidor/boveda" options={{ title: '' }} />
        <Stack.Screen name="profile/edit" options={{ title: '' }} />
        <Stack.Screen name="profile/followers" options={{ title: '' }} />
        <Stack.Screen name="creator/apply" options={{ title: '' }} />
        <Stack.Screen name="creator/link" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: '' }} />
        <Stack.Screen name="report" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="admin" options={{ title: '' }} />
        <Stack.Screen name="people" options={{ title: '' }} />
      </Stack.Protected>

      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
    </Stack>
  );
}

function NotConfigured() {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md }}>
      <Logo size={36} />
      <Text style={[type.body, { textAlign: 'center' }]}>{t('errors.notConfigured')}</Text>
    </View>
  );
}
