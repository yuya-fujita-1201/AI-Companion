export enum MemoryType {
  FACT = "FACT", // あなたのこと（名前・誕生日・仕事など）
  PREFERENCE = "PREFERENCE", // 好きなもの（食べ物・趣味・音楽など）
  EVENT = "EVENT", // 思い出（一緒に話したこと・特別な出来事）
  CONVERSATION_SUMMARY = "CONVERSATION_SUMMARY", // 最近の話題
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  importance: number; // 1-10
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemoryState {
  memories: Memory[];
  isLoading: boolean;
}

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  [MemoryType.FACT]: "あなたのこと",
  [MemoryType.PREFERENCE]: "好きなもの",
  [MemoryType.EVENT]: "思い出",
  [MemoryType.CONVERSATION_SUMMARY]: "最近の話題",
};

export const MEMORY_TYPE_ICONS: Record<MemoryType, string> = {
  [MemoryType.FACT]: "👤",
  [MemoryType.PREFERENCE]: "❤️",
  [MemoryType.EVENT]: "📖",
  [MemoryType.CONVERSATION_SUMMARY]: "💬",
};
