import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** Landing route for email confirmation, password reset and OAuth redirects (longash://auth-callback?code=…). */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [done, setDone] = useState(!code);
  const { session, needsProfile, ready } = useAuth();

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).finally(() => setDone(true));
  }, [code]);

  if (!done || !ready) return <Loading />;
  return <Redirect href={!session ? '/sign-in' : needsProfile ? '/profile-setup' : '/'} />;
}
