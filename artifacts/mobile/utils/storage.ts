import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/types';

const KEYS = {
  APP_STATE: '@ariseforge/app_state',
};

export async function saveAppState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.APP_STATE, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save app state:', e);
  }
}

export async function loadAppState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.APP_STATE);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch (e) {
    console.warn('Failed to load app state:', e);
    return null;
  }
}

export async function clearAppState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.APP_STATE);
  } catch (e) {
    console.warn('Failed to clear app state:', e);
  }
}
