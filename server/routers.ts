import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { chat } from "./_core/llm";
import { voiceRouter } from "./routers/voice";
import { memoryRouter } from "./routers/memory";
import { ttsRouter } from "./routers/tts";

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
              "あなたは親しみやすく、共感的なAIコンパニオンです。ユーザーとの会話を通じて、彼らのことを学び、記憶していきます。自然で温かみのある会話を心がけてください。",
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
