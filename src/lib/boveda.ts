import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { BovedaPack } from './types';

export const BOVEDA_SIZES = [8, 32, 60, 320] as const;
export const BOVEDA_RH = [65, 69, 72, 75] as const;
/** Boveda's guidance: 60 g packs per cigar count. Other sizes are converted by weight, which is an estimate. */
export const CIGARS_PER_60G = 25;

/** Boveda says replace every 3 months; a 320 g pack (the one in their own humidor) lasts about 6. */
export function suggestedDays(sizeG: number) {
  return sizeG === 320 ? 180 : 90;
}

export const daysLeft = (p: BovedaPack, now = Date.now()) =>
  Math.ceil((new Date(p.installed_on + 'T00:00:00').getTime() + p.replace_after_days * 86400000 - now) / 86400000);

/** How many 60 g packs the humidor needs, and how many it has (all sizes, by weight). */
export function coverage(packs: BovedaPack[], cigars: number) {
  const needed = cigars > 0 ? Math.ceil(cigars / CIGARS_PER_60G) : 0;
  const have = packs.reduce((g, p) => g + p.size_g * p.quantity, 0) / 60;
  const missing = Math.max(0, Math.ceil(needed - have - 1e-9));
  return { needed, have: Math.round(have * 10) / 10, missing };
}

const KEY = 'longash.boveda.notifications.v1';
const read = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
};
const write = (m: Record<string, string>) => {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ }
};

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** (Re)creates one reminder per pack at 9:00 on the day it should be replaced. Safe to call again whenever the packs change. */
export async function scheduleBovedaReminders(packs: BovedaPack[], title: string, body: (p: BovedaPack) => string) {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && !(await Notifications.requestPermissionsAsync()).granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('boveda', { name: 'Boveda', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const ids = read();
    const next: Record<string, string> = {};
    const live = new Set(packs.map((p) => p.id));
    for (const [packId, notifId] of Object.entries(ids)) {
      if (!live.has(packId)) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => null);
    }
    for (const p of packs) {
      if (ids[p.id]) await Notifications.cancelScheduledNotificationAsync(ids[p.id]).catch(() => null);
      const due = new Date(p.installed_on + 'T09:00:00');
      due.setDate(due.getDate() + p.replace_after_days);
      if (due.getTime() <= Date.now()) continue;
      next[p.id] = await Notifications.scheduleNotificationAsync({
        content: { title, body: body(p) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: due, channelId: 'boveda' },
      });
    }
    write(next);
  } catch {
    // notifications are a convenience; the app still shows what is due
  }
}
