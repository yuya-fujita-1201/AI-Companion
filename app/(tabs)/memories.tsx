import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MemoryCard } from "@/components/memory-card";
import { Memory, MemoryType } from "@/types/memory";
import { loadMemories, removeMemory, clearAllMemories } from "@/lib/memory-storage";
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

  const filters: { label: string; value: FilterType }[] = [
    { label: "すべて", value: "ALL" },
    { label: "事実", value: MemoryType.FACT },
    { label: "好み", value: MemoryType.PREFERENCE },
    { label: "イベント", value: MemoryType.EVENT },
    { label: "会話要約", value: MemoryType.CONVERSATION_SUMMARY },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">記憶</Text>
            <Text className="text-sm text-muted mt-1">
              {memories.length}件の記憶
            </Text>
          </View>
          {memories.length > 0 && (
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
                  "px-4 py-2 rounded-full border",
                  filter === f.value
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
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
            <Text className="text-4xl mb-4">🧠</Text>
            <Text className="text-xl font-semibold text-foreground text-center mb-2">
              {isLoading ? "読み込み中..." : "まだ記憶がありません"}
            </Text>
            {!isLoading && (
              <Text className="text-base text-muted text-center leading-relaxed">
                会話を通じて、AIがあなたのことを学んでいきます。
              </Text>
            )}
          </View>
        }
      />
    </ScreenContainer>
  );
}
