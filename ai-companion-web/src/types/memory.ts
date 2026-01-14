export type MemoryType = "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";

export type MemoryTier = "short" | "mid" | "long";

export type MemoryStatus = "active" | "archived";

export type Memory = {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  createdAt: string;
  tier?: MemoryTier;
  status?: MemoryStatus;
};
