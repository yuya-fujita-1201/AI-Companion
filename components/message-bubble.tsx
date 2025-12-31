import { View, Text, Image } from "react-native";
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
        "mb-4 flex-row",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <Image
          source={require("@/assets/images/cat-character.png")}
          style={{ width: 36, height: 36, marginRight: 8 }}
          resizeMode="contain"
        />
      )}

      {/* Message Bubble */}
      <View
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
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

      {/* User Avatar Placeholder */}
      {isUser && <View style={{ width: 36, marginLeft: 8 }} />}
    </View>
  );
}
