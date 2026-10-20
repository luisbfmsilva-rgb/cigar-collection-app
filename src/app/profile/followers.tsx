import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { Empty, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

export default function Followers() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: 'followers' | 'following' }>();
  const { t } = useI18n();
  const router = useRouter();
  const list = useAsync(async () => {
    const q = mode === 'followers'
      ? supabase.from('follows').select('p:profiles!follows_follower_id_fkey(*)').eq('followee_id', id)
      : supabase.from('follows').select('p:profiles!follows_followee_id_fkey(*)').eq('follower_id', id);
    const { data, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    return (data as unknown as { p: Profile }[]).map((r) => r.p);
  }, [id, mode]);

  return (
    <Screen>
      <Stack.Screen options={{ title: mode === 'followers' ? t('profile.followers') : t('profile.following') }} />
      <View>
        {(list.data ?? []).map((p) => <PersonRow key={p.id} p={p} onPress={() => router.push(`/user/${p.username}`)} />)}
        {(list.data ?? []).length === 0 && !list.loading ? <Empty text={t('common.empty')} /> : null}
      </View>
    </Screen>
  );
}
