import { Mic, Square } from "lucide-react";

type VoiceInputButtonProps = {
  isRecording: boolean;
  disabled?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export function VoiceInputButton({
  isRecording,
  disabled,
  onStartRecording,
  onStopRecording,
}: VoiceInputButtonProps) {
  const handlePointerDown = () => {
    if (!disabled) onStartRecording();
  };

  const handlePointerUp = () => {
    if (!disabled) onStopRecording();
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      disabled={disabled}
      className={[
        "flex h-12 w-12 items-center justify-center rounded-full transition",
        "border border-white/70 bg-primary text-white shadow-soft",
        disabled ? "cursor-not-allowed opacity-50" : "active:scale-95",
        isRecording ? "animate-pulse shadow-lg" : "",
      ].join(" ")}
      aria-label={isRecording ? "録音停止" : "録音開始"}
    >
      {isRecording ? <Square size={18} /> : <Mic size={18} />}
    </button>
  );
}
