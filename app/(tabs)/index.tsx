import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { VoiceInputButton } from "@/components/voice-input-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Message } from "@/types/chat";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useAudioRecorder, RecordingPresets, useAudioPlayer } from "expo-audio";
import { configureAudioMode, uploadAudioFile } from "@/lib/audio-recorder";
import { addMemory, loadMemories } from "@/lib/memory-storage";
import { Memory } from "@/types/memory";
import { searchRelevantConversations, formatRelevantConversations } from "@/lib/conversation-search";

const STORAGE_KEY = "chat_messages";

export default function ChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const audioPlayerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const chatMutation = trpc.chat.sendMessage.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();
  const extractMemoriesMutation = trpc.memory.extractMemories.useMutation();
  const ttsMutation = trpc.tts.synthesize.useMutation();

  // Load messages and TTS settings from storage on mount
  useEffect(() => {
    loadMessages();
    loadTTSSettings();
  }, []);

  const loadTTSSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem("tts_enabled");
      if (stored !== null) {
        setIsTTSEnabled(stored === "true");
      }
    } catch (error) {
      console.error("Failed to load TTS settings:", error);
    }
  };

  const saveTTSSettings = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem("tts_enabled", enabled.toString());
      setIsTTSEnabled(enabled);
    } catch (error) {
      console.error("Failed to save TTS settings:", error);
    }
  };

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  const handleStartRecording = async () => {
    try {
      await configureAudioMode();
      audioRecorder.record();
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("エラー", "音声録音の開始に失敗しました");
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) {
        Alert.alert("エラー", "音声の保存に失敗しました");
        return;
      }

      setIsTranscribing(true);

      // Upload audio file
      const audioUrl = await uploadAudioFile(uri);

      // Transcribe audio
      const transcription = await transcribeMutation.mutateAsync({
        audioUrl,
      });

      setIsTranscribing(false);

      // Send transcribed text as message
      if (transcription.text) {
        await handleSendMessage(transcription.text);
      }
    } catch (error) {
      setIsTranscribing(false);
      console.error("Failed to process voice input:", error);
      Alert.alert("エラー", "音声の処理に失敗しました");
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await handleSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSendMessage = async (text: string) => {
    if (isGenerating) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    // Scroll to bottom after adding user message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Load memories
      const memories = await loadMemories();
      const memoryContext = memories.length > 0
        ? `\n\n【記憶している情報】\n${memories.map((m, i) => `${i + 1}. [${m.type}] ${m.content} (重要度: ${m.importance}/10)`).join("\n")}`
        : "";

      // Search for relevant past conversations
      const relevantConversations = searchRelevantConversations(
        userMessage.content,
        messages,
        5, // Top 5 relevant conversations
        0.15 // Minimum relevance score
      );
      const conversationContext = formatRelevantConversations(relevantConversations);

      // Prepare context with memories and relevant conversations
      const contextMessage = memoryContext + conversationContext;

      // Call the tRPC API to get AI response
      const response = await chatMutation.mutateAsync({
        message: userMessage.content + contextMessage,
        history: messages.slice(-3).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom after adding AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Extract memories from conversation (async, non-blocking)
      extractAndSaveMemories([userMessage, assistantMessage]);

      // Play TTS if enabled
      if (isTTSEnabled) {
        playTTS(response.message);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "申し訳ございません。エラーが発生しました。もう一度お試しください。",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      setIsPlayingAudio(true);

      // Call TTS API
      const result = await ttsMutation.mutateAsync({
        text,
        language: "ja",
        speed: 1.0,
      });

      // Stop any currently playing audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.release();
      }

      // Create new audio player and play
      const player = useAudioPlayer(result.audioUrl);
      audioPlayerRef.current = player;

      player.play();

      // Wait for audio to finish
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!player.playing) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      setIsPlayingAudio(false);
    } catch (error) {
      console.error("Failed to play TTS:", error);
      setIsPlayingAudio(false);
    }
  };

  const extractAndSaveMemories = async (newMessages: Message[]) => {
    try {
      const recentMessages = [...messages, ...newMessages].slice(-10);

      const result = await extractMemoriesMutation.mutateAsync({
        messages: recentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      if (result.memories && result.memories.length > 0) {
        for (const mem of result.memories) {
          await addMemory({
            type: mem.type,
            content: mem.content,
            importance: mem.importance,
            timestamp: new Date(),
          });
        }
        console.log(`Extracted and saved ${result.memories.length} memories`);
      }
    } catch (error) {
      console.error("Failed to extract memories:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                AI Companion
              </Text>
              <Text className="text-sm text-muted mt-1">
                あなたのAIパートナー
              </Text>
            </View>
            {isPlayingAudio && (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-primary">🔊</Text>
                <Text className="text-xs text-muted">再生中</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-4xl mb-4">👋</Text>
              <Text className="text-xl font-semibold text-foreground text-center mb-2">
                こんにちは!
              </Text>
              <Text className="text-base text-muted text-center leading-relaxed">
                何でも話しかけてください。会話を通じてあなたのことを学んでいきます。
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Typing Indicator */}
        {isGenerating && <TypingIndicator />}

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-border bg-background">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="メッセージを入力..."
              placeholderTextColor={colors.muted}
              className="flex-1 bg-surface rounded-full px-4 py-3 text-base text-foreground"
              style={{ minHeight: 44 }}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!isGenerating && !isTranscribing}
            />
            {inputText.trim() ? (
              <Pressable
                onPress={handleSend}
                disabled={isGenerating || isTranscribing}
                style={({ pressed }) => [
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isGenerating || isTranscribing ? 0.5 : pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <IconSymbol name="paperplane.fill" size={20} color="white" />
              </Pressable>
            ) : (
              <VoiceInputButton
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                disabled={isGenerating || isTranscribing}
              />
            )}
          </View>
          {isTranscribing && (
            <Text className="text-sm text-muted text-center mt-2">
              音声を認識中...
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
