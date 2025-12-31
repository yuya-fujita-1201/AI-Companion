import { View, Text, Pressable, ScrollView, Alert, Switch } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllMemories } from "@/lib/memory-storage";
import { useThemeContext } from "@/lib/theme-provider";
import { loadBooleanSetting, saveBooleanSetting, saveThemeScheme, SETTINGS_KEYS } from "@/lib/settings";
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationFrequency,
  setNotificationFrequency,
} from "@/lib/notification-manager";
import { scheduleProactiveNotifications } from "@/lib/proactive-notification-scheduler";

export default function SettingsScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isVoiceInputEnabled, setIsVoiceInputEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequencyState] = useState(3);
  const isDarkMode = colorScheme === "dark";

  const loadSettings = useCallback(async () => {
    const [ttsEnabled, voiceEnabled] = await Promise.all([
      loadBooleanSetting(SETTINGS_KEYS.ttsEnabled, true),
      loadBooleanSetting(SETTINGS_KEYS.voiceInputEnabled, true),
    ]);
    setIsTTSEnabled(ttsEnabled);
    setIsVoiceInputEnabled(voiceEnabled);
  }, []);

  useEffect(() => {
    loadSettings();
    loadNotificationSettings();
  }, [loadSettings]);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await areNotificationsEnabled();
      const frequency = await getNotificationFrequency();
      setIsNotificationsEnabled(enabled);
      setNotificationFrequencyState(frequency);
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      await setNotificationsEnabled(value);
      setIsNotificationsEnabled(value);
      if (value) {
        // Re-schedule notifications when enabled
        await scheduleProactiveNotifications();
        Alert.alert("成功", "ミケからの通知を有効にしました！");
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      Alert.alert("エラー", "設定の保存に失敗しました");
    }
  };

  const handleFrequencyChange = async (frequency: number) => {
    try {
      await setNotificationFrequency(frequency);
      setNotificationFrequencyState(frequency);
      // Re-schedule with new frequency
      await scheduleProactiveNotifications();
      Alert.alert("成功", `1日${frequency}回の通知に設定しました！`);
    } catch (error) {
      console.error("Failed to save notification frequency:", error);
      Alert.alert("エラー", "設定の保存に失敗しました");
    }
  };

  const handleTTSToggle = async (value: boolean) => {
    try {
      await saveBooleanSetting(SETTINGS_KEYS.ttsEnabled, value);
      setIsTTSEnabled(value);
    } catch (error) {
      console.error("Failed to save TTS settings:", error);
      Alert.alert("エラー", "設定の保存に失敗しました");
    }
  };

  const handleVoiceInputToggle = async (value: boolean) => {
    try {
      await saveBooleanSetting(SETTINGS_KEYS.voiceInputEnabled, value);
      setIsVoiceInputEnabled(value);
    } catch (error) {
      console.error("Failed to save voice input settings:", error);
      Alert.alert("エラー", "設定の保存に失敗しました");
    }
  };

  const handleThemeToggle = async (value: boolean) => {
    const nextScheme = value ? "dark" : "light";
    const previousScheme = colorScheme;
    try {
      setColorScheme(nextScheme);
      await saveThemeScheme(nextScheme);
    } catch (error) {
      console.error("Failed to save theme settings:", error);
      setColorScheme(previousScheme);
      Alert.alert("エラー", "テーマ設定の保存に失敗しました");
    }
  };

  const handleClearChatHistory = () => {
    Alert.alert(
      "会話履歴を削除",
      "すべての会話履歴を削除してもよろしいですか? この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("chat_messages");
              Alert.alert("完了", "会話履歴を削除しました");
            } catch (error) {
              Alert.alert("エラー", "会話履歴の削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "すべてのデータを削除",
      "会話履歴と記憶をすべて削除してもよろしいですか? この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "すべて削除",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("chat_messages");
              await clearAllMemories();
              Alert.alert("完了", "すべてのデータを削除しました");
            } catch (error) {
              Alert.alert("エラー", "データの削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">設定</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Notification Settings Section */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">
            通知設定
          </Text>

          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-base font-medium text-foreground mb-1">
                  ミケからの通知
                </Text>
                <Text className="text-sm text-muted">
                  1日数回、ミケが話しかけてきます
                </Text>
              </View>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>

            {isNotificationsEnabled && (
              <View className="pt-4 border-t border-border">
                <Text className="text-sm font-medium text-foreground mb-3">
                  1日の通知回数: {notificationFrequency}回
                </Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((freq) => (
                    <Pressable
                      key={freq}
                      onPress={() => handleFrequencyChange(freq)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <View
                        className={`px-4 py-2 rounded-full border ${
                          notificationFrequency === freq
                            ? "bg-primary border-primary"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            notificationFrequency === freq
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {freq}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Voice Settings Section */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">
            音声設定
          </Text>

          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-medium text-foreground mb-1">
                  音声入力を有効にする
                </Text>
                <Text className="text-sm text-muted">
                  マイクボタンで音声入力できます
                </Text>
              </View>
              <Switch
                value={isVoiceInputEnabled}
                onValueChange={handleVoiceInputToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>

          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-medium text-foreground mb-1">
                  AI応答を音声で読み上げ
                </Text>
                <Text className="text-sm text-muted">
                  AIの返答を自動的に音声で再生します
                </Text>
              </View>
              <Switch
                value={isTTSEnabled}
                onValueChange={handleTTSToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">
            表示設定
          </Text>

          <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-medium text-foreground mb-1">
                  ダークモード
                </Text>
                <Text className="text-sm text-muted">
                  暗い配色に切り替えます
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">
            データ管理
          </Text>

          <Pressable
            onPress={handleClearChatHistory}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
              <Text className="text-base font-medium text-foreground mb-1">
                会話履歴を削除
              </Text>
              <Text className="text-sm text-muted">
                すべてのチャットメッセージを削除します
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleClearAllData}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View className="bg-surface rounded-2xl p-4 mb-3 border border-error/30">
              <Text className="text-base font-medium text-error mb-1">
                すべてのデータを削除
              </Text>
              <Text className="text-sm text-muted">
                会話履歴と記憶をすべて削除します
              </Text>
            </View>
          </Pressable>
        </View>

        {/* About Section */}
        <View className="px-4 py-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">
            アプリについて
          </Text>

          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-base font-medium text-foreground mb-2">
              AI Companion
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              あなたのAIパートナー。会話を通じてあなたのことを学び、記憶していきます。
            </Text>
            <Text className="text-xs text-muted mt-3">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
