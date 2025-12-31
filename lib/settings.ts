import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ColorScheme } from "@/constants/theme";

export const SETTINGS_KEYS = {
  ttsEnabled: "tts_enabled",
  voiceInputEnabled: "voice_input_enabled",
  themeScheme: "theme_scheme",
};

export async function loadBooleanSetting(
  key: string,
  fallback: boolean
): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) {
      return fallback;
    }
    return stored === "true";
  } catch (error) {
    console.error(`Failed to load setting ${key}:`, error);
    return fallback;
  }
}

export async function saveBooleanSetting(
  key: string,
  value: boolean
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
    throw error;
  }
}

export async function loadThemeScheme(): Promise<ColorScheme | null> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEYS.themeScheme);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return null;
  } catch (error) {
    console.error("Failed to load theme scheme:", error);
    return null;
  }
}

export async function saveThemeScheme(scheme: ColorScheme): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEYS.themeScheme, scheme);
  } catch (error) {
    console.error("Failed to save theme scheme:", error);
    throw error;
  }
}
