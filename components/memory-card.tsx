import { View, Text, Pressable } from "react-native";
import { Memory, MemoryType } from "@/types/memory";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

interface MemoryCardProps {
  memory: Memory;
  onDelete?: (id: string) => void;
}

const memoryTypeLabels: Record<MemoryType, string> = {
  [MemoryType.FACT]: "事実",
  [MemoryType.PREFERENCE]: "好み",
  [MemoryType.EVENT]: "イベント",
  [MemoryType.CONVERSATION_SUMMARY]: "会話要約",
};

const memoryTypeColors: Record<MemoryType, string> = {
  [MemoryType.FACT]: "bg-blue-500/10 border-blue-500/30",
  [MemoryType.PREFERENCE]: "bg-purple-500/10 border-purple-500/30",
  [MemoryType.EVENT]: "bg-green-500/10 border-green-500/30",
  [MemoryType.CONVERSATION_SUMMARY]: "bg-orange-500/10 border-orange-500/30",
};

export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
  const colors = useColors();

  const getImportanceLabel = (importance: number): string => {
    if (importance >= 8) return "非常に重要";
    if (importance >= 6) return "重要";
    if (importance >= 4) return "通常";
    return "参考";
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View
          className={cn(
            "px-3 py-1 rounded-full border",
            memoryTypeColors[memory.type]
          )}
        >
          <Text className="text-xs font-medium text-foreground">
            {memoryTypeLabels[memory.type]}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted">
            {getImportanceLabel(memory.importance)}
          </Text>
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
      <Text className="text-base text-foreground leading-relaxed mb-2">
        {memory.content}
      </Text>

      {/* Footer */}
      <Text className="text-xs text-muted">
        {new Date(memory.timestamp).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}
