import { describe, it, expect } from "vitest";
import { chat } from "../_core/llm";

describe("Chat API", () => {
  it("should return a response from LLM", async () => {
    const response = await chat({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Say hello",
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    expect(response).toHaveProperty("content");
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for API call
});
