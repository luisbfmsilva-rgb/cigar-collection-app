import 'expo-sqlite/localStorage/install';

/** Tiny per-device preferences (age confirmation, language). Never throws. */
export const prefs = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(`longash.${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(`longash.${key}`, value);
    } catch {
      // ignore
    }
  },
};
