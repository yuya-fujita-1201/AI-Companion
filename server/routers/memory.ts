import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { chat } from "../_core/llm";

const MemoryTypeEnum = z.enum(["FACT", "PREFERENCE", "EVENT", "CONVERSATION_SUMMARY"]);

export const memoryRouter = router({
  // Extract memories from conversation
  extractMemories: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { messages } = input;

      // Build conversation context
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`)
        .join("\n");

      // Ask LLM to extract memories
      const prompt = `以下の会話から、記憶すべき重要な情報を抽出してください。

会話:
${conversationText}

以下のJSON形式で、記憶すべき情報を配列で返してください:
[
  {
    "type": "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY",
    "content": "記憶する内容",
    "importance": 1-10の数値
  }
]

記憶の種類:
- FACT: ユーザーに関する事実や知識 (例: 職業、住んでいる場所、家族構成)
- PREFERENCE: ユーザーの好みや嗜好 (例: 好きな食べ物、趣味)
- EVENT: 重要な出来事 (例: 旅行の予定、記念日)
- CONVERSATION_SUMMARY: 会話全体の要約

重要度の目安:
- 1-3: 些細な情報
- 4-6: 通常の情報
- 7-9: 重要な情報
- 10: 非常に重要な情報

記憶すべき情報がない場合は空の配列を返してください。`;

      try {
        const response = await chat({
          messages: [
            {
              role: "system",
              content:
                "あなたは会話から重要な情報を抽出する専門家です。JSON形式で正確に応答してください。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        // Parse JSON response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          return { memories: [] };
        }

        const memories = JSON.parse(jsonMatch[0]);
        return { memories };
      } catch (error) {
        console.error("Failed to extract memories:", error);
        return { memories: [] };
      }
    }),

  // Get all memories
  list: publicProcedure.query(async () => {
    // In a real app, this would fetch from database
    // For now, return empty array
    return { memories: [] };
  }),

  // Add a memory
  add: publicProcedure
    .input(
      z.object({
        type: MemoryTypeEnum,
        content: z.string(),
        importance: z.number().min(1).max(10),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real app, this would save to database
      // For now, just return the input
      return {
        id: Date.now().toString(),
        ...input,
        timestamp: new Date(),
      };
    }),

  // Delete a memory
  remove: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real app, this would delete from database
      return { success: true };
    }),
});
