import { View, Text, Pressable } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Memory, MemoryType, MEMORY_TYPE_ICONS, MEMORY_TYPE_LABELS } from "@/types/memory";
import { cn } from "@/lib/utils";

interface MemoryCardProps {
  memory: Memory;
  onDelete?: (id: string) => void;
}

const memoryTypeColors: Record<MemoryType, string> = {
  [MemoryType.FACT]: "bg-amber-500/10 border-amber-500/30",
  [MemoryType.PREFERENCE]: "bg-rose-500/10 border-rose-500/30",
  [MemoryType.EVENT]: "bg-orange-500/10 border-orange-500/30",
  [MemoryType.CONVERSATION_SUMMARY]: "bg-yellow-500/10 border-yellow-500/30",
};

export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 250 });
  }, [cardOpacity]);

  const getImportanceLabel = (importance: number): string => {
    if (importance >= 8) return "とても大切";
    if (importance >= 6) return "大切";
    if (importance >= 4) return "ふつう";
    return "メモ";
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: (1 - cardOpacity.value) * 6 }],
  }));

  const importance = Math.max(0, Math.min(10, memory.importance));
  const importancePercentage = Math.round((importance / 10) * 100);
  const formattedDate = new Date(memory.timestamp).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="bg-surface rounded-2xl p-4 mb-3 border border-border"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          className={cn(
            "px-3 py-1 rounded-full border flex-row items-center gap-1",
            memoryTypeColors[memory.type]
          )}
        >
          <Text className="text-sm">{MEMORY_TYPE_ICONS[memory.type]}</Text>
          <Text className="text-xs font-medium text-foreground">
            {MEMORY_TYPE_LABELS[memory.type]}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {onDelete && (
            <Pressable
              onPress={() => onDelete(memory.id)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text className="text-xs text-error">削除</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <Text className="text-base text-foreground leading-relaxed">
        {memory.content}
      </Text>

      {/* Importance */}
      <View className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted">
            重要度 {importance}/10 ・{getImportanceLabel(importance)}
          </Text>
          <Text className="text-xs text-muted">{importancePercentage}%</Text>
        </View>
        <View className="h-2 bg-muted/20 rounded-full overflow-hidden mt-2">
          <View
            className="h-full bg-primary"
            style={{ width: `${importancePercentage}%` }}
          />
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center gap-2 mt-3">
        <Text className="text-sm">📅</Text>
        <Text className="text-xs text-muted">{formattedDate}</Text>
      </View>
    </Animated.View>
  );
}
