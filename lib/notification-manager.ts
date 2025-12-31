import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_ENABLED_KEY = "notifications_enabled";
const NOTIFICATION_FREQUENCY_KEY = "notification_frequency";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 * @returns true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  // Set up notification channel for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B35",
    });
  }

  return true;
}

/**
 * Schedule a notification
 * @param title - Notification title
 * @param body - Notification body
 * @param trigger - When to trigger the notification
 * @returns Notification identifier
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: "character_message" },
    },
    trigger,
  });
}

/**
 * Cancel a scheduled notification
 * @param identifier - Notification identifier
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return stored !== null ? JSON.parse(stored) : true; // Default to enabled
  } catch (error) {
    console.error("Failed to load notification settings:", error);
    return true;
  }
}

/**
 * Set notification enabled state
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}

/**
 * Get notification frequency (times per day)
 */
export async function getNotificationFrequency(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_FREQUENCY_KEY);
    return stored !== null ? JSON.parse(stored) : 3; // Default to 3 times per day
  } catch (error) {
    console.error("Failed to load notification frequency:", error);
    return 3;
  }
}

/**
 * Set notification frequency (times per day)
 */
export async function setNotificationFrequency(frequency: number): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_FREQUENCY_KEY, JSON.stringify(frequency));
  } catch (error) {
    console.error("Failed to save notification frequency:", error);
  }
}

/**
 * Generate random times for notifications throughout the day
 * @param count - Number of notifications per day
 * @returns Array of hour values (0-23)
 */
export function generateRandomNotificationTimes(count: number): number[] {
  const times: number[] = [];
  const minHour = 9; // Start at 9 AM
  const maxHour = 21; // End at 9 PM
  
  // Divide the day into segments
  const segmentSize = (maxHour - minHour) / count;
  
  for (let i = 0; i < count; i++) {
    const segmentStart = minHour + i * segmentSize;
    const segmentEnd = segmentStart + segmentSize;
    const randomHour = Math.floor(Math.random() * (segmentEnd - segmentStart) + segmentStart);
    times.push(randomHour);
  }
  
  return times.sort((a, b) => a - b);
}
