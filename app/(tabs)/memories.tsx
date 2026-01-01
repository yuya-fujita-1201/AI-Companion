import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MemoryCard } from "@/components/memory-card";
import { Memory, MemoryType, MEMORY_TYPE_ICONS, MEMORY_TYPE_LABELS } from "@/types/memory";
import { loadMemories, removeMemory, clearAllMemories } from "@/lib/memory-storage";
import { calculateMemoryProgress, MEMORY_LEVEL_STEP } from "@/lib/memory-progress";
import { cn } from "@/lib/utils";

type FilterType = "ALL" | MemoryType;

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemoriesData();
  }, []);

  const loadMemoriesData = async () => {
    setIsLoading(true);
    const loaded = await loadMemories();
    setMemories(loaded);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "記憶を削除",
      "この記憶を削除してもよろしいですか?",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            await removeMemory(id);
            await loadMemoriesData();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "すべての記憶を削除",
      "すべての記憶を削除してもよろしいですか? この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "すべて削除",
          style: "destructive",
          onPress: async () => {
            await clearAllMemories();
            await loadMemoriesData();
          },
        },
      ]
    );
  };

  const filteredMemories =
    filter === "ALL"
      ? memories
      : memories.filter((m) => m.type === filter);

  const filters: { label: string; value: FilterType; icon?: string }[] = [
    { label: "すべて", value: "ALL", icon: "✨" },
    { label: MEMORY_TYPE_LABELS[MemoryType.FACT], value: MemoryType.FACT, icon: MEMORY_TYPE_ICONS[MemoryType.FACT] },
    {
      label: MEMORY_TYPE_LABELS[MemoryType.PREFERENCE],
      value: MemoryType.PREFERENCE,
      icon: MEMORY_TYPE_ICONS[MemoryType.PREFERENCE],
    },
    { label: MEMORY_TYPE_LABELS[MemoryType.EVENT], value: MemoryType.EVENT, icon: MEMORY_TYPE_ICONS[MemoryType.EVENT] },
    {
      label: MEMORY_TYPE_LABELS[MemoryType.CONVERSATION_SUMMARY],
      value: MemoryType.CONVERSATION_SUMMARY,
      icon: MEMORY_TYPE_ICONS[MemoryType.CONVERSATION_SUMMARY],
    },
  ];

  const memoryCount = memories.length;
  const progress = calculateMemoryProgress(memoryCount, MEMORY_LEVEL_STEP);
  const progressPercentage = Math.round(progress.progress * 100);
  const milestoneMessage = isLoading
    ? "読み込み中..."
    : progress.isLevelUp
      ? `レベル${progress.level}になったにゃ！`
      : `次のレベルまであと${progress.remaining}個だにゃ`;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-border">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              ミケが覚えたこと 🐱
            </Text>
            <Text className="text-sm text-muted mt-1">
              {isLoading
                ? "記憶を読み込み中..."
                : `ミケは${memoryCount}個のことを覚えているにゃ！`}
            </Text>
          </View>
          {memoryCount > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text className="text-sm text-error">すべて削除</Text>
            </Pressable>
          )}
        </View>

        <View className="mt-4 bg-surface rounded-2xl border border-border p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted">ミケの知識レベル</Text>
            <Text className="text-sm font-semibold text-foreground">
              Lv.{progress.level}
            </Text>
          </View>
          <View className="h-2 bg-muted/20 rounded-full overflow-hidden mt-2">
            <View
              className="h-full bg-primary"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-muted">{milestoneMessage}</Text>
            <Text className="text-xs text-muted">
              次: {progress.nextLevelAt}個
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row gap-2 flex-wrap">
          {filters.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                className={cn(
                  "px-4 py-2 rounded-full border flex-row items-center gap-2",
                  filter === f.value
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
                {f.icon && (
                  <Text
                    className={cn(
                      "text-sm",
                      filter === f.value ? "text-white" : "text-foreground"
                    )}
                  >
                    {f.icon}
                  </Text>
                )}
                <Text
                  className={cn(
                    "text-sm font-medium",
                    filter === f.value ? "text-white" : "text-foreground"
                  )}
                >
                  {f.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Memories List */}
      <FlatList
        data={filteredMemories}
        renderItem={({ item }) => (
          <MemoryCard memory={item} onDelete={handleDelete} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-4xl mb-4">🐾</Text>
            <Text className="text-xl font-semibold text-foreground text-center mb-2">
              {isLoading ? "読み込み中..." : "ミケの記憶はまだ少なめだにゃ"}
            </Text>
            {!isLoading && (
              <Text className="text-base text-muted text-center leading-relaxed">
                いろんなお話を聞かせてくれると、
                ミケが少しずつ覚えていくにゃ。
              </Text>
            )}
          </View>
        }
      />
    </ScreenContainer>
  );
}
