export const MEMORY_LEVEL_STEP = 10;

export type MemoryProgress = {
  level: number;
  progress: number;
  remaining: number;
  nextLevelAt: number;
  isLevelUp: boolean;
  currentLevelCount: number;
};

export function calculateMemoryProgress(
  count: number,
  step: number = MEMORY_LEVEL_STEP
): MemoryProgress {
  const safeStep = Math.max(1, Math.floor(step));
  const safeCount = Math.max(0, Math.floor(count));
  const level = Math.floor(safeCount / safeStep) + 1;
  const currentLevelCount = safeCount % safeStep;
  const progress = safeCount === 0 ? 0 : currentLevelCount / safeStep;
  const nextLevelAt = level * safeStep;
  const remaining = nextLevelAt - safeCount;
  const isLevelUp = safeCount > 0 && currentLevelCount === 0;

  return {
    level,
    progress,
    remaining,
    nextLevelAt,
    isLevelUp,
    currentLevelCount,
  };
}
