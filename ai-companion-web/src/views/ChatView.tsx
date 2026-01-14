import { useState } from "react";
import { ChevronLeft, SendHorizonal, Volume2, VolumeX } from "lucide-react";
import { ChatList } from "../components/ChatList";
import { TypingIndicator } from "../components/TypingIndicator";
import { VoiceInputButton } from "../components/VoiceInputButton";
import { useChat } from "../hooks/useChat";
import { useVoiceInput } from "../hooks/useVoiceInput";

type ChatViewProps = {
  onBack: () => void;
  chat: ReturnType<typeof useChat>;
};

export function ChatView({ onBack, chat }: ChatViewProps) {
  const voice = useVoiceInput();
  const [error, setError] = useState<string | null>(null);

  const handleStartRecording = async () => {
    setError(null);
    try {
      await voice.startRecording();
    } catch (err) {
      console.error(err);
      setError("マイクの許可が必要です。設定をご確認ください。");
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await voice.stopRecording();
      if (!blob) return;
      const text = await voice.transcribeAudio(blob);
      if (text) {
        await chat.sendMessage(text);
      }
    } catch (err) {
      console.error(err);
      setError("音声の変換に失敗しました。");
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/70 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-soft transition active:scale-95"
          aria-label="戻る"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/assets/images/cat-character.png"
            alt="ミケ"
            className="h-10 w-10 rounded-full bg-white/80 p-1"
          />
          <div>
            <p className="text-sm font-bold text-foreground">ミケ</p>
            {chat.isPlayingAudio ? (
              <span className="text-xs text-primary">🔊 話し中...</span>
            ) : (
              <span className="text-xs text-muted">いっしょにおしゃべり</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={chat.isPlayingAudio ? chat.stopTTS : undefined}
          className="flex h-9 items-center gap-2 rounded-full bg-white/80 px-3 text-xs text-muted shadow-soft transition"
        >
          {chat.isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {chat.isPlayingAudio ? "停止" : "音声"}
        </button>
      </header>

      <ChatList messages={chat.messages} isGenerating={chat.isGenerating || voice.isTranscribing} />

      {(chat.isGenerating || voice.isTranscribing) && <TypingIndicator />}

      {error && (
        <div className="px-4 pb-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/70 bg-white/90 px-3 py-3">
        <VoiceInputButton
          isRecording={voice.isRecording}
          disabled={chat.isGenerating || voice.isTranscribing}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
        <input
          value={chat.inputText}
          onChange={(event) => chat.setInputText(event.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-full bg-surface px-4 py-2 text-sm text-foreground outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              chat.sendMessage(chat.inputText);
            }
          }}
        />
        <button
          type="button"
          onClick={() => chat.sendMessage(chat.inputText)}
          disabled={!chat.inputText.trim() || chat.isGenerating}
          className={[
            "flex h-11 w-11 items-center justify-center rounded-full transition",
            chat.inputText.trim() && !chat.isGenerating
              ? "bg-primary text-white shadow-soft active:scale-95"
              : "bg-surface text-muted",
          ].join(" ")}
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
