import { describe, it, expect } from "vitest";
import { analyzeEmotion } from "../lib/emotion-analyzer";

describe("Emotion Analyzer", () => {
  it("should detect happy emotion", () => {
    const text = "嬉しいにゃん！ありがとうだにゃ！";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("happy");
  });

  it("should detect sad emotion", () => {
    const text = "悲しいにゃ...寂しいにゃ...";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("sad");
  });

  it("should detect angry emotion", () => {
    const text = "怒ったにゃ！ムカつくにゃ！";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("angry");
  });

  it("should detect surprised emotion", () => {
    const text = "びっくりしたにゃ！え！まじかにゃ！";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("surprised");
  });

  it("should detect shy emotion", () => {
    const text = "恥ずかしいにゃ...照れるにゃん...";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("shy");
  });

  it("should detect thinking emotion", () => {
    const text = "うーん、考えてるにゃ...難しいにゃ...";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("thinking");
  });

  it("should return neutral for no emotion keywords", () => {
    const text = "今日は天気が良いにゃ。";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("neutral");
  });

  it("should prioritize emotion with most keywords", () => {
    const text = "嬉しいにゃ！楽しいにゃ！ありがとうだにゃ！でもちょっと悲しいにゃ。";
    const emotion = analyzeEmotion(text);
    expect(emotion).toBe("happy"); // 3 happy keywords vs 1 sad keyword
  });
});
