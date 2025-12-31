export enum MemoryType {
  FACT = "FACT", // 一般的な事実や知識
  PREFERENCE = "PREFERENCE", // ユーザーの好み
  EVENT = "EVENT", // 重要なイベント
  CONVERSATION_SUMMARY = "CONVERSATION_SUMMARY", // 会話の要約
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
