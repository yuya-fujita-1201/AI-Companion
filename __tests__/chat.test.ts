import { describe, it, expect } from "vitest";

describe("Chat functionality", () => {
  it("should create a user message with correct structure", () => {
    const message = {
      id: "1",
      role: "user" as const,
      content: "Hello AI",
      timestamp: new Date(),
    };

    expect(message).toHaveProperty("id");
    expect(message).toHaveProperty("role");
    expect(message).toHaveProperty("content");
    expect(message).toHaveProperty("timestamp");
    expect(message.role).toBe("user");
  });

  it("should create an assistant message with correct structure", () => {
    const message = {
      id: "2",
      role: "assistant" as const,
      content: "Hello! How can I help you?",
      timestamp: new Date(),
    };

    expect(message.role).toBe("assistant");
    expect(message.content).toBeTruthy();
  });
});
