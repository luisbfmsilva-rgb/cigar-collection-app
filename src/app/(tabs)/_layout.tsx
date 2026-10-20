import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, fonts } from '@/lib/theme';

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  explore: ['compass-outline', 'compass'],
  humidor: ['file-tray-stacked-outline', 'file-tray-stacked'],
  me: ['person-circle-outline', 'person-circle'],
};

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgDeep },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.feed'), headerShown: false }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.explore'), headerShown: false }} />
      <Tabs.Screen name="checkin" options={{ title: t('tabs.checkin') }} />
      <Tabs.Screen name="humidor" options={{ title: t('tabs.humidor'), headerShown: false }} />
      <Tabs.Screen name="me" options={{ title: t('tabs.profile'), headerShown: false }} />
    </Tabs>
  );
}

function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reset } = useCheckinDraft();
  const { t } = useI18n();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', backgroundColor: colors.bgDeep,
        borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        if (route.name === 'checkin') {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={t('tabs.checkin')}
              onPress={() => {
                reset();
                router.push('/checkin/pick-cigar');
              }}
              style={({ pressed }) => ({
                width: 64, height: 64, marginTop: -26, borderRadius: 32, backgroundColor: colors.accent,
                alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: colors.bg, opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon name="add" size={30} color={colors.onAccent} />
            </Pressable>
          );
        }
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const [off, on] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
        const color = focused ? colors.accent : colors.textMuted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={{ width: 68, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <Icon name={focused ? on : off} size={24} color={color} />
            <Text style={{ color, fontSize: 11, fontFamily: focused ? fonts.bold : fonts.semibold }} numberOfLines={1}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
