import type { Memory } from "../types/memory";

const STORAGE_KEY = "memories";

export function loadMemories(): Memory[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Memory[];
  } catch (error) {
    console.error("Failed to parse memories", error);
    return [];
  }
}

export function saveMemories(memories: Memory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

export function deleteMemory(id: string) {
  const memories = loadMemories().filter((memory) => memory.id !== id);
  saveMemories(memories);
  return memories;
}

export function updateMemory(updated: Memory) {
  const memories = loadMemories().map((memory) =>
    memory.id === updated.id ? updated : memory
  );
  saveMemories(memories);
  return memories;
}

export function upsertMemories(newMemories: Memory[]) {
  const existing = loadMemories();
  const merged = [...existing];
  newMemories.forEach((memory) => {
    const already = merged.find(
      (item) => item.content === memory.content && item.type === memory.type
    );
    if (!already) {
      merged.push(memory);
    }
  });
  saveMemories(merged);
  return merged;
}

export function findRelevantMemories(query: string, limit = 5): Memory[] {
  const memories = loadMemories();
  if (!query.trim()) return memories.slice(0, limit);

  const tokens = query
    .toLowerCase()
    .split(/[\s、。,.!?！？]/)
    .filter(Boolean);

  const scored = memories
    .map((memory) => {
      const content = memory.content.toLowerCase();
      const score = tokens.reduce((sum, token) => (content.includes(token) ? sum + 1 : sum), 0);
      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.importance - a.memory.importance);

  return scored.slice(0, limit).map((item) => item.memory);
}
