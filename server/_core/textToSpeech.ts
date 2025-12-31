/**
 * Text-to-Speech helper using internal TTS service
 *
 * Frontend implementation guide:
 * 1. Call TTS API with text to convert
 * 2. Receive audio URL
 * 3. Play audio using expo-audio
 *
 * Example usage:
 * ```tsx
 * // Frontend component
 * const ttsMutation = trpc.tts.synthesize.useMutation({
 *   onSuccess: (data) => {
 *     // Play the audio
 *     const player = useAudioPlayer(data.audioUrl);
 *     player.play();
 *   }
 * });
 *
 * ttsMutation.mutate({
 *   text: "こんにちは、AIコンパニオンです。",
 *   language: "ja",
 * });
 * ```
 */
import { ENV } from "./env";

export type SynthesizeOptions = {
  text: string; // Text to convert to speech
  language?: string; // Language code (e.g., "ja", "en")
  voice?: string; // Voice ID (optional)
  speed?: number; // Speech speed (0.5 - 2.0, default: 1.0)
};

export type SynthesizeResponse = {
  audioUrl: string; // URL to the generated audio file
  duration: number; // Duration in seconds
};

export type SynthesizeError = {
  error: string;
  code:
    | "TEXT_TOO_LONG"
    | "INVALID_LANGUAGE"
    | "SYNTHESIS_FAILED"
    | "SERVICE_ERROR";
  details?: string;
};

/**
 * Convert text to speech using the internal TTS service
 *
 * @param options - Text and synthesis parameters
 * @returns Audio URL or error
 */
export async function synthesizeSpeech(
  options: SynthesizeOptions,
): Promise<SynthesizeResponse | SynthesizeError> {
  try {
    // Step 1: Validate environment configuration
    if (!ENV.forgeApiUrl) {
      return {
        error: "TTS service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set",
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "TTS service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set",
      };
    }

    // Step 2: Validate input
    if (options.text.length > 4000) {
      return {
        error: "Text exceeds maximum length",
        code: "TEXT_TOO_LONG",
        details: `Text length is ${options.text.length}, maximum allowed is 4000 characters`,
      };
    }

    // Step 3: Prepare request payload
    const payload = {
      model: "tts-1",
      input: options.text,
      voice: options.voice || "alloy",
      speed: options.speed || 1.0,
      response_format: "mp3",
    };

    // Step 4: Call the TTS service
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;

    const fullUrl = new URL("v1/audio/speech", baseUrl).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "TTS service request failed",
        code: "SYNTHESIS_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    // Step 5: Get audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

    // Step 6: Upload to storage and get URL
    const formData = new FormData();
    formData.append("file", audioBlob, "speech.mp3");

    const uploadUrl = new URL("v1/files/upload", baseUrl).toString();
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      return {
        error: "Failed to upload audio file",
        code: "SERVICE_ERROR",
        details: `Upload failed with status ${uploadResponse.status}`,
      };
    }

    const uploadData = await uploadResponse.json();

    // Estimate duration (rough estimate: ~150 words per minute, ~5 characters per word for Japanese)
    const estimatedDuration = Math.max(
      1,
      Math.ceil((options.text.length / 5 / 150) * 60),
    );

    return {
      audioUrl: uploadData.url || uploadData.file?.url,
      duration: estimatedDuration,
    };
  } catch (error) {
    // Handle unexpected errors
    return {
      error: "Text-to-speech conversion failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Example tRPC procedure implementation:
 *
 * ```ts
 * // In server/routers.ts
 * import { synthesizeSpeech } from "./_core/textToSpeech";
 *
 * export const ttsRouter = router({
 *   synthesize: publicProcedure
 *     .input(z.object({
 *       text: z.string(),
 *       language: z.string().optional(),
 *       voice: z.string().optional(),
 *       speed: z.number().min(0.5).max(2.0).optional(),
 *     }))
 *     .mutation(async ({ input }) => {
 *       const result = await synthesizeSpeech(input);
 *
 *       // Check if it's an error
 *       if ('error' in result) {
 *         throw new TRPCError({
 *           code: 'BAD_REQUEST',
 *           message: result.error,
 *           cause: result,
 *         });
 *       }
 *
 *       return result;
 *     }),
 * });
 * ```
 */
