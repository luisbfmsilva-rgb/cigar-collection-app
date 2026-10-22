import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { isConfigured, supabase } from './supabase';
import type { Profile } from './types';

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Signed in but the profile (username + birthdate) is not complete yet. */
  needsProfile: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileLoaded(true);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setReady(true);
    });
    let currentUser: string | undefined;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      const nextUser = next?.user.id;
      if (nextUser === currentUser) return; // token refresh etc.: keep the loaded profile
      currentUser = nextUser;
      setProfileLoaded(false);
      // Defer the query so it does not run inside the auth callback.
      setTimeout(() => loadProfile(nextUser), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(() => ({
    ready: ready && (!session || profileLoaded),
    session,
    profile,
    needsProfile: !!session && profileLoaded && !profile,
    refreshProfile: () => loadProfile(session?.user.id),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [ready, session, profile, profileLoaded, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The signed-in user's profile. Only use on screens behind the auth gate. */
export function useMe(): Profile {
  const { profile } = useAuth();
  if (!profile) throw new Error('No profile');
  return profile;
}

// ---------------------------------------------------------------------------
// Sign-in methods
// ---------------------------------------------------------------------------

export type OAuthProvider = 'google' | 'facebook' | 'apple';

export async function signInWithProvider(provider: OAuthProvider) {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return;
  }

  const redirectTo = makeRedirectUri({ scheme: 'longash', path: 'auth-callback' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;

  const params = new URL(result.url).searchParams;
  const code = params.get('code');
  const errorDescription = params.get('error_description');
  if (errorDescription) throw new Error(errorDescription);
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
  }
}

export async function appleSignInAvailable() {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/** Native "Sign in with Apple" on iOS (required by App Store guideline 4.8). */
export async function signInWithAppleNative() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error('Apple did not return an identity token');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  return { suggestedName: name || null };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: makeRedirectUri({ scheme: 'longash', path: 'auth-callback' }) },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: makeRedirectUri({ scheme: 'longash', path: 'auth-callback' }),
  });
  if (error) throw error;
}

/** Minimum birth date for someone who is 21 today. */
export function isAtLeast21(birthdate: Date, today = new Date()) {
  const limit = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
  return birthdate.getTime() <= limit.getTime();
}
