import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { synthesizeSpeech } from "../_core/textToSpeech";

export const ttsRouter = router({
  synthesize: publicProcedure
    .input(
      z.object({
        text: z.string(),
        language: z.string().optional(),
        voice: z.string().optional(),
        speed: z.number().min(0.5).max(2.0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await synthesizeSpeech(input);

      if ("error" in result) {
        throw new Error(result.error);
      }

      return result;
    }),
});
