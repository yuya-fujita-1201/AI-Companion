import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Memory } from "../types/memory";

type MemoryCardProps = {
  memory: Memory;
  onDelete: (id: string) => void;
  onUpdate: (memory: Memory) => void;
};

const typeLabels: Record<Memory["type"], { label: string; emoji: string }> = {
  FACT: { label: "あなたのこと", emoji: "👤" },
  PREFERENCE: { label: "好きなもの", emoji: "❤️" },
  EVENT: { label: "思い出", emoji: "📖" },
  CONVERSATION_SUMMARY: { label: "最近の話題", emoji: "💬" },
};

export function MemoryCard({ memory, onDelete, onUpdate }: MemoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(memory.content);

  const handleSave = () => {
    onUpdate({ ...memory, content: draft.trim() || memory.content });
    setIsEditing(false);
  };

  const meta = typeLabels[memory.type];

  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="text-base">{meta.emoji}</span>
          <span>{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
                aria-label="保存"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(memory.content);
                  setIsEditing(false);
                }}
                className="rounded-full bg-surface p-2 text-muted transition hover:bg-surface/80"
                aria-label="キャンセル"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-full bg-surface p-2 text-muted transition hover:bg-surface/80"
                aria-label="編集"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(memory.id)}
                className="rounded-full bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-100"
                aria-label="削除"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="mt-3 min-h-[80px] w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
        />
      ) : (
        <p className="mt-3 text-sm text-foreground">{memory.content}</p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          重要度: {memory.importance}/10
        </span>
        <span>
          {new Date(memory.createdAt).toLocaleDateString("ja-JP")}
        </span>
      </div>
    </div>
  );
}
