import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/** Asks for permission and stores this device's push token so followed people's posts can notify the user. Silent on failure. */
export async function registerForPush(userId: string) {
  try {
    if (Platform.OS === 'web') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('social', { name: 'Posts', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && !(await Notifications.requestPermissionsAsync()).granted) return;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await supabase.from('push_tokens').upsert({ token, user_id: userId, platform: Platform.OS, updated_at: new Date().toISOString() });
  } catch {
    // push needs Firebase on Android; the app works without it
  }
}
