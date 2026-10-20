import { RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileView } from '@/components/ProfileView';
import { Loading, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function Me() {
  const { profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  if (!profile) return <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={refreshProfile} tintColor={colors.accent} />}>
        <ProfileView profile={profile} isMe />
      </Screen>
    </View>
  );
}
