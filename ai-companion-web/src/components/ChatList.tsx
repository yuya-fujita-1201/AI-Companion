import { useEffect, useRef } from "react";
import type { Message } from "../types/chat";
import { ChatMessage } from "./ChatMessage";

type ChatListProps = {
  messages: Message[];
  isGenerating: boolean;
};

export function ChatList({ messages, isGenerating }: ChatListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
        <div className="text-5xl">👋</div>
        <h2 className="mt-4 text-xl font-bold text-foreground">こんにちは！</h2>
        <p className="mt-2 text-sm text-muted">
          何でも話しかけてください。会話を通じてあなたのことを学んでいきます。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
