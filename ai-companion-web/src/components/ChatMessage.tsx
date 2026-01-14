import ReactMarkdown from "react-markdown";
import type { Message } from "../types/chat";

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-bubble",
          isUser
            ? "rounded-br-md bg-primary text-white shadow-none"
            : "rounded-bl-md bg-white/90 text-foreground",
        ].join(" ")}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="whitespace-pre-wrap text-sm text-foreground">
            {message.content}
          </ReactMarkdown>
        )}
        <p className="mt-2 text-[11px] text-muted">
          {new Date(message.timestamp).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
