import { motion } from "framer-motion";
import { CharacterStatus } from "../components/CharacterStatus";

type HomeViewProps = {
  onStartChat: () => void;
  onOpenMemories: () => void;
  mood: "happy" | "thinking" | "normal";
  friendshipLevel: number;
  daysTogether: number;
  conversationCount: number;
};

const moodLabels: Record<HomeViewProps["mood"], string> = {
  happy: "ごきげん",
  thinking: "かんがえ中",
  normal: "のんびり",
};

const moodImages: Record<HomeViewProps["mood"], string> = {
  happy: "/assets/images/cat-character-happy.png",
  thinking: "/assets/images/cat-character-thinking.png",
  normal: "/assets/images/cat-character.png",
};

export function HomeView({
  onStartChat,
  onOpenMemories,
  mood,
  friendshipLevel,
  daysTogether,
  conversationCount,
}: HomeViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-12 text-center">
      <motion.img
        key={mood}
        src={moodImages[mood]}
        alt="ミケ"
        className="h-64 w-64 object-contain"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
      />

      <h1 className="mt-6 text-3xl font-bold text-foreground">ミケ</h1>
      <p className="mt-2 text-sm text-muted">あなたのAIパートナー</p>

      <div className="mt-8 w-full">
        <CharacterStatus
          friendshipLevel={friendshipLevel}
          daysTogether={daysTogether}
          conversationCount={conversationCount}
          moodLabel={moodLabels[mood]}
        />
      </div>

      <button
        type="button"
        onClick={onStartChat}
        className="mt-10 rounded-full bg-primary px-10 py-3 text-base font-bold text-white shadow-soft transition hover:brightness-105 active:scale-95"
      >
        おしゃべりする
      </button>
      <button
        type="button"
        onClick={onOpenMemories}
        className="mt-3 rounded-full bg-white/90 px-8 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-white"
      >
        ミケの記憶を見る
      </button>
    </div>
  );
}
