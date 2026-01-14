export type MemoryType = "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";

export type Memory = {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  createdAt: string;
};
