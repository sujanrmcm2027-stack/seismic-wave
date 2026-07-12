import { FinishReason, GoogleGenAI } from "@google/genai";
import { EMERGENCY_ASSISTANT_SYSTEM_PROMPT } from "@/lib/chatbot/systemPrompt";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const MODEL_ID = "gemini-2.5-flash";

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server — set it in the deployment environment.",
    );
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

// finishReason values that mean the model was blocked or cut short by
// safety filters rather than actually answering.
const BLOCKED_FINISH_REASONS = new Set<FinishReason>([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
]);

const REFUSAL_FALLBACK_TEXT =
  "\n\nI can't help with that request. If you're in immediate danger, call Police 100 or National Emergency 1149.";

/**
 * Streams Gemini's reply as a plain UTF-8 text ReadableStream — no SSE
 * framing, no JSON envelope — so the client can read it with nothing more
 * than `response.body.getReader()` + `TextDecoder`. This is the same
 * contract useChatStream.ts already consumes; swapping the model provider
 * only means changing what happens inside this file.
 */
export function streamAssistantReply({
  turns,
  lowBandwidth,
}: {
  turns: ChatTurn[];
  lowBandwidth: boolean;
}): ReadableStream<Uint8Array> {
  const ai = getClient();
  const encoder = new TextEncoder();

  // Gemini's roles are "user" / "model", not "user" / "assistant" — map at
  // the boundary so the rest of the app can keep using "assistant".
  const contents = turns.map((turn) => ({
    role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: turn.content }],
  }));

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = await ai.models.generateContentStream({
          model: MODEL_ID,
          contents,
          config: {
            systemInstruction: EMERGENCY_ASSISTANT_SYSTEM_PROMPT,
            maxOutputTokens: lowBandwidth ? 300 : 800,
          },
        });

        let sawText = false;
        let lastFinishReason: FinishReason | undefined;

        for await (const chunk of stream) {
          if (chunk.promptFeedback?.blockReason) {
            controller.enqueue(encoder.encode(REFUSAL_FALLBACK_TEXT));
            controller.close();
            return;
          }
          if (chunk.text) {
            sawText = true;
            controller.enqueue(encoder.encode(chunk.text));
          }
          lastFinishReason = chunk.candidates?.[0]?.finishReason;
        }

        if (!sawText && lastFinishReason && BLOCKED_FINISH_REASONS.has(lastFinishReason)) {
          controller.enqueue(encoder.encode(REFUSAL_FALLBACK_TEXT));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
