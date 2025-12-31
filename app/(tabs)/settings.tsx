import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllMemories } from "@/lib/memory-storage";

export default function SettingsScreen() {
  const colors = useColors();

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
