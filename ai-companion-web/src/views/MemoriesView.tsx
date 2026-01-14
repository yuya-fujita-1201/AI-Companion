import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { Memory, MemoryType } from "../types/memory";
import { deleteMemory, loadMemories, updateMemory } from "../lib/memories";
import { MemoryCard } from "../components/MemoryCard";

type MemoriesViewProps = {
  onBack: () => void;
};

const tabs: { key: "ALL" | MemoryType; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "FACT", label: "あなたのこと" },
  { key: "PREFERENCE", label: "好きなもの" },
  { key: "EVENT", label: "思い出" },
  { key: "CONVERSATION_SUMMARY", label: "最近の話題" },
];

export function MemoriesView({ onBack }: MemoriesViewProps) {
  const [memories, setMemories] = useState<Memory[]>(() => loadMemories());
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("ALL");

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return memories;
    return memories.filter((memory) => memory.type === activeTab);
  }, [activeTab, memories]);

  const level = Math.floor(memories.length / 10) + 1;
  const progress = memories.length % 10;

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-white/70 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-soft transition active:scale-95"
          aria-label="戻る"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-sm text-muted">ミケが覚えたこと</p>
          <h2 className="text-lg font-bold text-foreground">メモリーズ</h2>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
          <p className="text-sm text-muted">
            ミケは {memories.length} 個のことを覚えているにゃ！
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>知識レベル {level}</span>
              <span>{progress}/10</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(progress / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "rounded-full px-3 py-1 text-xs transition",
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "bg-white/80 text-muted",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/80 px-4 py-6 text-center text-sm text-muted">
            まだ記憶がないにゃ。たくさんお話ししよう！
          </div>
        ) : (
          filtered.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onDelete={(id) => setMemories(deleteMemory(id))}
              onUpdate={(updated) => setMemories(updateMemory(updated))}
            />
          ))
        )}
      </div>
    </div>
  );
}
