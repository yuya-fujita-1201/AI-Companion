export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      <span className="text-xs text-muted">ミケが考え中...</span>
    </div>
  );
}
