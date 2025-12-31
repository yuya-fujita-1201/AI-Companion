import { describe, it, expect, beforeEach } from "vitest";
import { MemoryType } from "../types/memory";

describe("Memory functionality", () => {
  it("should create a memory with correct structure", () => {
    const memory = {
      id: "1",
      type: MemoryType.FACT,
      content: "User likes coffee",
      importance: 7,
      timestamp: new Date(),
    };

    expect(memory).toHaveProperty("id");
    expect(memory).toHaveProperty("type");
    expect(memory).toHaveProperty("content");
    expect(memory).toHaveProperty("importance");
    expect(memory).toHaveProperty("timestamp");
  });

  it("should have valid memory types", () => {
    expect(MemoryType.FACT).toBe("FACT");
    expect(MemoryType.PREFERENCE).toBe("PREFERENCE");
    expect(MemoryType.EVENT).toBe("EVENT");
    expect(MemoryType.CONVERSATION_SUMMARY).toBe("CONVERSATION_SUMMARY");
  });

  it("should validate importance range", () => {
    const validImportance = 5;
    expect(validImportance).toBeGreaterThanOrEqual(1);
    expect(validImportance).toBeLessThanOrEqual(10);

    const invalidLow = 0;
    const invalidHigh = 11;
    expect(invalidLow).toBeLessThan(1);
    expect(invalidHigh).toBeGreaterThan(10);
  });
});
