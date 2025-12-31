import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "./trpc";
import { TRPCClientError } from "@trpc/client";
import { loadMemories } from "./memory-storage";
import {
  requestNotificationPermissions,
  scheduleNotification,
  cancelAllNotifications,
  generateRandomNotificationTimes,
  areNotificationsEnabled,
  getNotificationFrequency,
} from "./notification-manager";

const LAST_SCHEDULE_DATE_KEY = "last_schedule_date";

/**
 * Get time of day based on hour
 */
function getTimeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Schedule proactive notifications for the day
 */
export async function scheduleProactiveNotifications(): Promise<void> {
  try {
    // Check if notifications are enabled
    const enabled = await areNotificationsEnabled();
    if (!enabled) {
      console.log("Notifications are disabled");
      return;
    }

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log("Notification permission not granted");
      return;
    }

    // Check if we already scheduled for today
    const lastScheduleDate = await AsyncStorage.getItem(LAST_SCHEDULE_DATE_KEY);
    const today = new Date().toDateString();
    
    if (lastScheduleDate === today) {
      console.log("Already scheduled notifications for today");
      return;
    }

    // Cancel all existing notifications
    await cancelAllNotifications();

    // Get notification frequency
    const frequency = await getNotificationFrequency();

    // Generate random times for notifications
    const notificationTimes = generateRandomNotificationTimes(frequency);

    console.log(`Scheduling ${frequency} notifications for today at hours:`, notificationTimes);

    // Load memories
    const memories = await loadMemories();
    const topMemories = memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);

    // Schedule notifications
    for (const hour of notificationTimes) {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      // Skip if the time has already passed today
      if (scheduledTime <= now) {
        continue;
      }

      const timeOfDay = getTimeOfDay(hour);

      try {
        // For now, use a simple fallback message
        // TODO: Implement server-side message generation properly
        const greetings = {
          morning: "おはようだにゃ！今日も元気にしてるかにゃ？",
          afternoon: "こんにちはにゃん！何してるのかにゃ？",
          evening: "こんばんはだにゃ！今日はどうだったかにゃ？",
          night: "まだ起きてるのかにゃ？お話しようにゃ！",
        };
        const message = greetings[timeOfDay];
        
        /* const result = await trpc.proactiveMessage.generateMessage.query({
          memories: topMemories.map((m) => ({
            type: m.type,
            content: m.content,
            importance: m.importance,
          })),
          timeOfDay,
        }); */

        // Schedule the notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "ミケからのメッセージ 🐱",
            body: message,
            data: { type: "character_message" },
          },
          trigger: { type: 'date', timestamp: scheduledTime.getTime() } as any,
        });

        console.log(`Scheduled notification at ${scheduledTime.toLocaleTimeString()}`);
      } catch (error) {
        console.error("Failed to schedule notification:", error);
      }
    }

    // Save the schedule date
    await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, today);
    console.log("Successfully scheduled all notifications for today");
  } catch (error) {
    console.error("Failed to schedule proactive notifications:", error);
  }
}

/**
 * Initialize proactive notifications (call this on app start)
 */
export async function initializeProactiveNotifications(): Promise<() => void> {
  // Schedule notifications for today
  await scheduleProactiveNotifications();

  // Set up listener for when app comes to foreground
  // This will reschedule if needed
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received:", notification);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Handle notification tap (when user opens the app from notification)
 */
export function setupNotificationResponseListener(
  onNotificationTap: (message: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data.type === "character_message") {
      const message = response.notification.request.content.body || "";
      onNotificationTap(message);
    }
  });

  return () => {
    subscription.remove();
  };
}
