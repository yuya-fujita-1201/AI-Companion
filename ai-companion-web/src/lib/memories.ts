import type { Memory } from "../types/memory";

export async function fetchMemories(): Promise<Memory[]> {
  try {
    const response = await fetch("/api/memories");
    if (!response.ok) return [];
    const data = (await response.json()) as { memories?: Memory[] };
    return data.memories ?? [];
  } catch (error) {
    console.error("Failed to fetch memories", error);
    return [];
  }
}

export async function deleteMemory(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/memories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete memory", error);
    return false;
  }
}

export async function updateMemory(memory: Memory): Promise<Memory | null> {
  try {
    const response = await fetch("/api/memories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: memory.id,
        content: memory.content,
        importance: memory.importance,
        type: memory.type,
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { memory?: Memory };
    return data.memory ?? null;
  } catch (error) {
    console.error("Failed to update memory", error);
    return null;
  }
}
