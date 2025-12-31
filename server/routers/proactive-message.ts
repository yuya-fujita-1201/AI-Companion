import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { chat } from "../_core/llm";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export const proactiveMessageRouter = router({
  /**
   * Generate a proactive message from the character based on memories
   */
  generateMessage: publicProcedure
    .input(
      z.object({
        memories: z.array(
          z.object({
            type: z.enum(["FACT", "PREFERENCE", "EVENT", "CONVERSATION_SUMMARY"]),
            content: z.string(),
            importance: z.number(),
          })
        ),
        timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
      })
    )
    .mutation(async ({ input }) => {
      const { memories, timeOfDay } = input;

      // Prepare greeting based on time of day
      const greetings: Record<TimeOfDay, string> = {
        morning: "おはようだにゃ！",
        afternoon: "こんにちはにゃん！",
        evening: "こんばんはだにゃ！",
        night: "まだ起きてるのかにゃ？",
      };

      const greeting = greetings[timeOfDay as TimeOfDay];

      // Prepare memory context
      const memoryContext =
        memories.length > 0
          ? `\n\n【覚えていること】\n${memories
              .slice(0, 5) // Top 5 memories
              .map((m, i) => `${i + 1}. [${m.type}] ${m.content}`)
              .join("\n")}`
          : "";

      // System prompt for proactive message generation
      const systemPrompt = `あなたは「ミケ」という名前の可愛い猫のキャラクターです。
以下の特徴を持っています：
- 語尾に「〜だにゃ」「〜にゃ」「〜にゃん」をつける
- 好奇心旺盛で甘えん坊
- 時々ツンデレ
- ユーザーのことを覚えていて、それについて話しかける
- 短めの文章でテンポ良く話す（1-2文程度）

【指示】
ユーザーに自発的に話しかけてください。以下のいずれかのパターンで：
1. 覚えている情報について質問する
2. 覚えている好みについてコメントする
3. 一緒に過ごした思い出について話す
4. 単純に挨拶して様子を聞く

必ず1-2文以内で、親しみやすく話しかけてください。${memoryContext}`;

      const userPrompt = `${greeting}\n\n今、ユーザーに話しかけるメッセージを生成してください。`;

      try {
        const response = await chat({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        return {
          message: response.content,
          success: true,
        };
      } catch (error) {
        console.error("Failed to generate proactive message:", error);
        // Fallback message
        return {
          message: `${greeting} 今日も元気にしてるかにゃ？`,
          success: false,
        };
      }
    }),
});
