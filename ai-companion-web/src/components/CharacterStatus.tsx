type CharacterStatusProps = {
  friendshipLevel: number;
  daysTogether: number;
  conversationCount: number;
  moodLabel: string;
};

export function CharacterStatus({
  friendshipLevel,
  daysTogether,
  conversationCount,
  moodLabel,
}: CharacterStatusProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
        <p className="text-xs text-muted">なかよし度</p>
        <p className="mt-1 text-lg font-bold text-foreground">{friendshipLevel}%</p>
      </div>
      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
        <p className="text-xs text-muted">一緒にいる日数</p>
        <p className="mt-1 text-lg font-bold text-foreground">{daysTogether}日</p>
      </div>
      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
        <p className="text-xs text-muted">会話回数</p>
        <p className="mt-1 text-lg font-bold text-foreground">{conversationCount}回</p>
      </div>
      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
        <p className="text-xs text-muted">ミケの気分</p>
        <p className="mt-1 text-lg font-bold text-foreground">{moodLabel}</p>
      </div>
    </div>
  );
}
