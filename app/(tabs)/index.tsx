import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { VoiceInputButton } from "@/components/voice-input-button";
import { CharacterStatus } from "@/components/character-status";
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
const FIRST_MEET_DATE_KEY = "first_meet_date";

export default function ChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [firstMeetDate, setFirstMeetDate] = useState<Date>(new Date());
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
    loadFirstMeetDate();
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages]);

  const loadFirstMeetDate = async () => {
    try {
      const stored = await AsyncStorage.getItem(FIRST_MEET_DATE_KEY);
      if (stored) {
        setFirstMeetDate(new Date(stored));
      } else {
        const now = new Date();
        await AsyncStorage.setItem(FIRST_MEET_DATE_KEY, now.toISOString());
        setFirstMeetDate(now);
      }
    } catch (error) {
      console.error("Failed to load first meet date:", error);
    }
  };

  const getDaysTogether = (): number => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstMeetDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFriendshipLevel = (): number => {
    // Calculate based on conversation count (max 100)
    const conversationCount = Math.floor(messages.length / 2);
    return Math.min(100, conversationCount * 5);
  };

  const getMood = (): "happy" | "normal" | "thinking" => {
    if (isGenerating) return "thinking";
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      return "happy";
    }
    return "normal";
  };

  const getCharacterImage = () => {
    const mood = getMood();
    switch (mood) {
      case "happy":
        return require("@/assets/images/cat-character-happy.png");
      case "thinking":
        return require("@/assets/images/cat-character-thinking.png");
      default:
        return require("@/assets/images/cat-character.png");
    }
  };

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

  const loadTTSSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem("tts_enabled");
      if (stored !== null) {
        setIsTTSEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load TTS settings:", error);
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
        throw new Error("Recording URI is undefined");
      }

      setIsTranscribing(true);

      // Upload audio file
      const audioUrl = await uploadAudioFile(uri);

      // Transcribe audio
      const transcription = await transcribeMutation.mutateAsync({
        audioUrl,
      });

      setIsTranscribing(false);

      if (transcription.text) {
        handleSendMessage(transcription.text);
      }
    } catch (error) {
      console.error("Failed to process voice input:", error);
      setIsTranscribing(false);
      Alert.alert("エラー", "音声の処理に失敗しました");
    }
  };

  const extractAndSaveMemories = async (conversationMessages: Message[]) => {
    try {
      const conversation = conversationMessages
        .map((m) => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`)
        .join("\n");

      const result = await extractMemoriesMutation.mutateAsync({
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Save memories to local storage
      for (const memory of result.memories) {
        await addMemory(memory);
      }
    } catch (error) {
      console.error("Failed to extract memories:", error);
    }
  };

  const playTTS = async (text: string) => {
    try {
      setIsPlayingAudio(true);

      const result = await ttsMutation.mutateAsync({
        text,
        voice: "female_voice",
      });

      if (result.audioUrl) {
        // Create audio player
        const player = useAudioPlayer(result.audioUrl);
        audioPlayerRef.current = player;

        // Play audio
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

        // Clean up
        player.release();
        audioPlayerRef.current = null;
      }

      setIsPlayingAudio(false);
    } catch (error) {
      console.error("Failed to play TTS:", error);
      setIsPlayingAudio(false);
    }
  };

  const stopTTS = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.release();
      audioPlayerRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    setInputText("");

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
      console.error("Failed to send message:", error);
      Alert.alert("エラー", "メッセージの送信に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const conversationCount = Math.floor(messages.length / 2);

  if (!showChat) {
    // Home screen with character
    return (
      <ScreenContainer className="bg-gradient-to-b from-orange-50 to-white">
        <View className="flex-1 items-center justify-center px-6">
          {/* Character Image */}
          <View className="items-center mb-8">
            <Image
              source={getCharacterImage()}
              style={{ width: 280, height: 280 }}
              resizeMode="contain"
            />
          </View>

          {/* Character Name */}
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: colors.foreground }}
          >
            ミケ
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.muted }}>
            あなたのAIパートナー
          </Text>

          {/* Character Status */}
          <CharacterStatus
            friendshipLevel={getFriendshipLevel()}
            mood={getMood()}
            daysTogether={getDaysTogether()}
            conversationCount={conversationCount}
          />

          {/* Talk Button */}
          <Pressable
            onPress={() => setShowChat(true)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className="mt-8 px-12 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white text-lg font-bold">おしゃべりする</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // Chat screen
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <Pressable
            onPress={() => setShowChat(false)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>

          <View className="flex-row items-center">
            <Image
              source={getCharacterImage()}
              style={{ width: 40, height: 40, marginRight: 8 }}
              resizeMode="contain"
            />
            <View>
              <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
                ミケ
              </Text>
              {isPlayingAudio && (
                <Text className="text-xs" style={{ color: colors.primary }}>
                  🔊 話し中...
                </Text>
              )}
            </View>
          </View>

          {isPlayingAudio && (
            <Pressable
              onPress={stopTTS}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-sm" style={{ color: colors.error }}>
                停止
              </Text>
            </Pressable>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">👋</Text>
              <Text className="text-xl font-bold mb-2" style={{ color: colors.foreground }}>
                こんにちは！
              </Text>
              <Text className="text-center px-8" style={{ color: colors.muted }}>
                何でも話しかけてください。会話を通じて{"\n"}あなたのことを学んでいきます。
              </Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {(isGenerating || isTranscribing) && (
          <View className="px-4 pb-2">
            <TypingIndicator />
          </View>
        )}

        {/* Input Area */}
        <View
          className="flex-row items-center px-4 py-3 border-t"
          style={{ borderTopColor: colors.border, backgroundColor: colors.background }}
        >
          <VoiceInputButton
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={isGenerating || isTranscribing}
          />

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            placeholderTextColor={colors.muted}
            className="flex-1 mx-3 px-4 py-3 rounded-full"
            style={{
              backgroundColor: colors.surface,
              color: colors.foreground,
            }}
            onSubmitEditing={() => handleSendMessage(inputText)}
            returnKeyType="send"
            editable={!isGenerating && !isTranscribing}
          />

          <Pressable
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isGenerating || isTranscribing}
            style={({ pressed }) => [
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            className="w-12 h-12 rounded-full items-center justify-center"
          >
            <IconSymbol
              name="paperplane.fill"
              size={20}
              color={inputText.trim() ? "white" : colors.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
