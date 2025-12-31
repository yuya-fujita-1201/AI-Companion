import { View, Text } from "react-native";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      className={cn(
        "mb-3 px-4",
        isUser ? "items-end" : "items-start"
      )}
    >
      <View
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary rounded-tr-sm"
            : "bg-surface rounded-tl-sm"
        )}
      >
        <Text
          className={cn(
            "text-base leading-relaxed",
            isUser ? "text-white" : "text-foreground"
          )}
        >
          {message.content}
        </Text>
        <Text
          className={cn(
            "text-xs mt-1",
            isUser ? "text-white/70" : "text-muted"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}
