import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { transcribeAudio } from "../_core/voiceTranscription";

export const voiceRouter = router({
  transcribe: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const { audioUrl } = input;

      const result = await transcribeAudio({
        audioUrl,
        language: "ja",
      });

      if ("error" in result) {
        throw new Error(result.error);
      }

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    }),
});
