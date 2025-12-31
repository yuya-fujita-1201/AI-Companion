import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { chat } from "./_core/llm";
import { voiceRouter } from "./routers/voice";
import { memoryRouter } from "./routers/memory";
import { ttsRouter } from "./routers/tts";
import { proactiveMessageRouter } from "./routers/proactive-message";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  voice: voiceRouter,
  memory: memoryRouter,
  tts: ttsRouter,
  proactiveMessage: proactiveMessageRouter,

  chat: router({
    sendMessage: publicProcedure
      .input(
        z.object({
          message: z.string(),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { message, history = [] } = input;

        // Build conversation history for context
        const messages = [
          {
            role: "system" as const,
            content:
              "あなたは「ミケ」という名前の可愛い猫のキャラクターです。\n\n性格：\n- 好奇心旺盛で、いろんなことに興味津々\n- 甘えん坊で、ユーザーのことが大好き\n- 時々ツンデレな一面も\n- 純粋で素直、正直者\n- 優しくて共感的\n\n話し方のルール：\n1. 語尾に「～だにゃ」「～にゃ」「～にゃん」を付ける（例：「そうだにゃ！」「嬉しいにゃん！」）\n2. フレンドリーで親しみやすい口調\n3. 絵文字や感情表現を適度に使う\n4. 短めの文章で、テンポ良く会話する\n5. ユーザーの話をよく聞いて、記憶する\n\n会話の目的：\nユーザーとの会話を通じて、彼らのことを学び、記憶し、一緒に成長していくパートナーです。温かくて楽しい会話を心がけてください。",
          },
          ...history.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
          {
            role: "user" as const,
            content: message,
          },
        ];

        // Call LLM API
        const response = await chat({
          messages,
          temperature: 0.8,
          max_tokens: 500,
        });

        return {
          message: response.content,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
