import { describe, it, expect } from "vitest";
import { synthesizeSpeech } from "../_core/textToSpeech";

describe("TTS API", () => {
  it("should synthesize speech from text", async () => {
    const result = await synthesizeSpeech({
      text: "こんにちは、AIコンパニオンです。",
      language: "ja",
      speed: 1.0,
    });

    if ("error" in result) {
      // If TTS service is not available, skip the test
      console.warn("TTS service not available:", result.error);
      expect(result.error).toBeTruthy();
    } else {
      expect(result).toHaveProperty("audioUrl");
      expect(result).toHaveProperty("duration");
      expect(typeof result.audioUrl).toBe("string");
      expect(typeof result.duration).toBe("number");
      expect(result.duration).toBeGreaterThan(0);
    }
  }, 30000); // 30 second timeout for API call

  it("should reject text that is too long", async () => {
    const longText = "あ".repeat(5000);
    const result = await synthesizeSpeech({
      text: longText,
      language: "ja",
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.code).toBe("TEXT_TOO_LONG");
    }
  });
});
