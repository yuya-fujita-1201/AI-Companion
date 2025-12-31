/**
 * Emotion types that the character can express
 */
export type Emotion = "happy" | "sad" | "angry" | "surprised" | "shy" | "thinking" | "neutral";

/**
 * Keywords associated with each emotion
 */
const emotionKeywords: Record<Emotion, string[]> = {
  happy: [
    "嬉しい", "楽しい", "幸せ", "ありがとう", "良かった", "最高", "素晴らしい",
    "わーい", "やったー", "すごい", "好き", "大好き", "面白い", "笑",
  ],
  sad: [
    "悲しい", "寂しい", "辛い", "残念", "泣", "涙", "切ない", "悔しい",
    "ごめん", "申し訳", "心配", "不安",
  ],
  angry: [
    "怒", "ムカつく", "イライラ", "腹立つ", "許せない", "ダメ", "やめて",
    "嫌", "最悪", "うるさい",
  ],
  surprised: [
    "びっくり", "驚", "え！", "まじ", "本当", "すごい", "信じられない",
    "なんと", "！", "？！",
  ],
  shy: [
    "恥ずかしい", "照れる", "えへへ", "もじもじ", "ドキドキ", "緊張",
    "褒めて", "ありがとう",
  ],
  thinking: [
    "考え", "うーん", "そうだなぁ", "どうしよう", "わからない", "難しい",
    "悩", "迷",
  ],
  neutral: [],
};

/**
 * Analyze the emotion from AI response text
 * @param text - The AI response text
 * @returns The detected emotion
 */
export function analyzeEmotion(text: string): Emotion {
  const scores: Record<Emotion, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    shy: 0,
    thinking: 0,
    neutral: 0,
  };

  // Count keyword matches for each emotion
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[emotion as Emotion] += 1;
      }
    }
  }

  // Find the emotion with the highest score
  let maxEmotion: Emotion = "neutral";
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion as Emotion;
    }
  }

  // If no emotion detected, return neutral
  return maxScore > 0 ? maxEmotion : "neutral";
}

/**
 * Get the character image path for the given emotion
 * @param emotion - The emotion type
 * @returns The image path
 */
export function getCharacterImageForEmotion(emotion: Emotion): any {
  switch (emotion) {
    case "happy":
      return require("@/assets/images/cat-character-happy.png");
    case "sad":
      return require("@/assets/images/cat-character-sad.png");
    case "angry":
      return require("@/assets/images/cat-character-angry.png");
    case "surprised":
      return require("@/assets/images/cat-character-surprised.png");
    case "shy":
      return require("@/assets/images/cat-character-shy.png");
    case "thinking":
      return require("@/assets/images/cat-character-thinking.png");
    case "neutral":
    default:
      return require("@/assets/images/cat-character.png");
  }
}
