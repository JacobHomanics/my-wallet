import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function readPersistedJson<T>(key: string): Promise<T | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        raw = window.localStorage.getItem(key);
      }
    } else {
      raw = await SecureStore.getItemAsync(key);
    }
    if (raw == null || raw === '') {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writePersistedJson(
  key: string,
  value: unknown,
): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, raw);
      }
      return;
    }
    await SecureStore.setItemAsync(key, raw);
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}
