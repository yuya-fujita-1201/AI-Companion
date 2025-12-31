import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface CharacterStatusProps {
  friendshipLevel: number; // 0-100
  mood: "happy" | "normal" | "thinking";
  daysTogether: number;
  conversationCount: number;
}

export function CharacterStatus({
  friendshipLevel,
  mood,
  daysTogether,
  conversationCount,
}: CharacterStatusProps) {
  const colors = useColors();

  const getMoodEmoji = () => {
    switch (mood) {
      case "happy":
        return "😊";
      case "thinking":
        return "🤔";
      default:
        return "😺";
    }
  };

  const getMoodText = () => {
    switch (mood) {
      case "happy":
        return "ごきげん";
      case "thinking":
        return "考え中";
      default:
        return "ふつう";
    }
  };

  return (
    <View className="w-full px-6 py-4">
      {/* Friendship Level */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            なかよし度
          </Text>
          <Text className="text-sm font-bold" style={{ color: colors.primary }}>
            {friendshipLevel}%
          </Text>
        </View>
        <View className="h-3 bg-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${friendshipLevel}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-around">
        {/* Mood */}
        <View className="items-center">
          <Text className="text-2xl mb-1">{getMoodEmoji()}</Text>
          <Text className="text-xs" style={{ color: colors.muted }}>
            {getMoodText()}
          </Text>
        </View>

        {/* Days Together */}
        <View className="items-center">
          <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
            {daysTogether}
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>
            一緒の日数
          </Text>
        </View>

        {/* Conversation Count */}
        <View className="items-center">
          <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
            {conversationCount}
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>
            会話回数
          </Text>
        </View>
      </View>
    </View>
  );
}
