import { Stack, useLocalSearchParams } from 'expo-router';
import { ProfileView } from '@/components/ProfileView';
import { ErrorText, Loading, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { getProfileByUsername } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { t } = useI18n();
  const { profile: me } = useAuth();
  const p = useAsync(() => getProfileByUsername(username), [username]);
  if (p.loading && !p.data) return <Loading />;
  if (!p.data) return <Screen><ErrorText message={p.error ?? t('common.error')} /></Screen>;
  return (
    <Screen>
      <Stack.Screen options={{ title: `@${p.data.username}` }} />
      <ProfileView profile={p.data} isMe={p.data.id === me?.id} onChanged={p.reload} />
    </Screen>
  );
}
