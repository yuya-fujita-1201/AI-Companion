import { useCallback, useEffect, useMemo, useState } from "react";
import type { Message } from "../types/chat";
import type { Memory } from "../types/memory";
import { findRelevantMemories, upsertMemories } from "../lib/memories";

const STORAGE_KEY = "chat_messages";
const FIRST_MEET_DATE_KEY = "first_meet_date";

type ChatResponse = {
  message: string;
};

type MemoryResponse = {
  memories: Memory[];
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [firstMeetDate, setFirstMeetDate] = useState<Date | null>(null);
  const [ttsEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Message[];
        setMessages(parsed);
      } catch (error) {
        console.error("Failed to parse stored messages", error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const stored = localStorage.getItem(FIRST_MEET_DATE_KEY);
    if (stored) {
      setFirstMeetDate(new Date(stored));
    } else {
      const now = new Date();
      localStorage.setItem(FIRST_MEET_DATE_KEY, now.toISOString());
      setFirstMeetDate(now);
    }
  }, []);

  const daysTogether = useMemo(() => {
    if (!firstMeetDate) return 1;
    const diffMs = Math.abs(Date.now() - firstMeetDate.getTime());
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [firstMeetDate]);

  const conversationCount = Math.floor(messages.length / 2);
  const friendshipLevel = Math.min(100, conversationCount * 5);

  const mood = useMemo(() => {
    if (isGenerating) return "thinking";
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") return "happy";
    return "normal";
  }, [isGenerating, messages]);

  const stopTTS = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, []);

  const playTTS = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const extractMemories = useCallback(async (conversation: Message[]) => {
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as MemoryResponse;
      if (data.memories?.length) {
        upsertMemories(
          data.memories.map((memory) => ({
            ...memory,
            id: memory.id || crypto.randomUUID(),
            createdAt: memory.createdAt || new Date().toISOString(),
            importance: memory.importance ?? 5,
            type: memory.type ?? "CONVERSATION_SUMMARY",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to extract memories", error);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;
      setInputText("");

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);

      try {
        const history = [...messages, userMessage].slice(-4);
        const relevantMemories = findRelevantMemories(userMessage.content, 5);
        const memoryContext =
          relevantMemories.length > 0
            ? `【記憶している情報】\n${relevantMemories
                .map(
                  (memory, index) =>
                    `${index + 1}. [${memory.type}] ${memory.content} (重要度: ${memory.importance}/10)`
                )
                .join("\n")}`
            : "";

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            history,
            memoryContext,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch response");
        }

        const data = (await response.json()) as ChatResponse;
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message ?? "ごめんなさい、もう一度話しかけてにゃ。",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (ttsEnabled) playTTS(assistantMessage.content);
        if ((messages.length + 1) % 6 === 0) {
          extractMemories([userMessage, assistantMessage]);
        }
      } catch (error) {
        console.error("Failed to send message", error);
        const fallbackMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "通信に失敗したみたい。あとでもう一度話しかけてにゃ。",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      } finally {
        setIsGenerating(false);
      }
    },
    [extractMemories, isGenerating, messages, playTTS, ttsEnabled]
  );

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isGenerating,
    isPlayingAudio,
    playTTS,
    stopTTS,
    sendMessage,
    daysTogether,
    conversationCount,
    friendshipLevel,
    mood,
  };
}
