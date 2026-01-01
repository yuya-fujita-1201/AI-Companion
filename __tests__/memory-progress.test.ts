import { describe, it, expect } from "vitest";
import { calculateMemoryProgress, MEMORY_LEVEL_STEP } from "../lib/memory-progress";

describe("memory progress", () => {
  it("starts at level 1 with zero progress", () => {
    const result = calculateMemoryProgress(0, MEMORY_LEVEL_STEP);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(0);
    expect(result.remaining).toBe(MEMORY_LEVEL_STEP);
    expect(result.isLevelUp).toBe(false);
  });

  it("calculates progress within the first level", () => {
    const result = calculateMemoryProgress(3, MEMORY_LEVEL_STEP);
    expect(result.level).toBe(1);
    expect(result.progress).toBeCloseTo(0.3);
    expect(result.remaining).toBe(7);
    expect(result.isLevelUp).toBe(false);
  });

  it("flags level-up milestones", () => {
    const result = calculateMemoryProgress(10, MEMORY_LEVEL_STEP);
    expect(result.level).toBe(2);
    expect(result.progress).toBe(0);
    expect(result.remaining).toBe(10);
    expect(result.isLevelUp).toBe(true);
  });

  it("handles later levels correctly", () => {
    const result = calculateMemoryProgress(25, MEMORY_LEVEL_STEP);
    expect(result.level).toBe(3);
    expect(result.progress).toBeCloseTo(0.5);
    expect(result.remaining).toBe(5);
    expect(result.nextLevelAt).toBe(30);
  });
});
