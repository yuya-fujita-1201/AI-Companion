import { motion } from "framer-motion";

type HomeViewProps = {
  onStartChat: () => void;
  onOpenMemories: () => void;
};

export function HomeView({ onStartChat, onOpenMemories }: HomeViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-12 text-center bg-background">
      <div className="relative">
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-white p-4 text-sm text-text shadow-soft"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          30秒だけ、置いていく。
        </motion.div>

        <motion.img
          src="/assets/images/mochi_character.png"
          alt="モチ"
          className="h-64 w-64 object-contain"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        />
      </div>

      <h1 className="mt-8 text-2xl font-bold text-text tracking-wide">モチ</h1>
      <p className="mt-2 text-xs text-accent">無口な相棒</p>

      <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          onClick={onStartChat}
          className="w-full rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-soft transition hover:brightness-105 active:scale-95"
        >
          一言残す / 話しかける
        </button>

        <button
          type="button"
          onClick={onOpenMemories}
          className="w-full rounded-full bg-secondary/50 px-8 py-3 text-sm font-medium text-text transition hover:bg-secondary"
        >
          振り返る
        </button>
      </div>
    </div>
  );
}
