import AsyncStorage from "@react-native-async-storage/async-storage";
import { Memory, MemoryType } from "@/types/memory";

const MEMORY_STORAGE_KEY = "app_memories";

export async function saveMemories(memories: Memory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error("Failed to save memories:", error);
  }
}

export async function loadMemories(): Promise<Memory[]> {
  try {
    const stored = await AsyncStorage.getItem(MEMORY_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch (error) {
    console.error("Failed to load memories:", error);
    return [];
  }
}

export async function addMemory(memory: Omit<Memory, "id">): Promise<Memory> {
  const memories = await loadMemories();
  const newMemory: Memory = {
    ...memory,
    id: Date.now().toString(),
  };
  memories.push(newMemory);
  await saveMemories(memories);
  return newMemory;
}

export async function removeMemory(id: string): Promise<void> {
  const memories = await loadMemories();
  const filtered = memories.filter((m) => m.id !== id);
  await saveMemories(filtered);
}

export async function getMemoriesByType(type: MemoryType): Promise<Memory[]> {
  const memories = await loadMemories();
  return memories.filter((m) => m.type === type);
}

export async function searchMemories(query: string): Promise<Memory[]> {
  const memories = await loadMemories();
  const lowerQuery = query.toLowerCase();
  return memories.filter((m) =>
    m.content.toLowerCase().includes(lowerQuery)
  );
}

export async function clearAllMemories(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MEMORY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear memories:", error);
  }
}
