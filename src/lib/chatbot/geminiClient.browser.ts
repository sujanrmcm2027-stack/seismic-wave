import { GoogleGenAI } from "@google/genai";
import { EMERGENCY_ASSISTANT_SYSTEM_PROMPT } from "@/lib/chatbot/systemPrompt";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const MODEL_ID = "gemini-2.0-flash";

// Hardcoded so the chatbot works on any static hosting environment.
// Restrict this key to your domain in Google AI Studio for extra protection.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  if (!GEMINI_API_KEY) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set. Add it to your .env file.",
    );
  }
  cachedClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return cachedClient;
}

/**
 * Streams Gemini's reply as an async generator of text chunks.
 * Runs entirely in the browser — no server or server function needed.
 */
export async function* streamAssistantReplyBrowser({
  turns,
  lowBandwidth,
}: {
  turns: ChatTurn[];
  lowBandwidth: boolean;
}): AsyncGenerator<string> {
  const ai = getClient();

  // Gemini uses "user" / "model", not "user" / "assistant"
  const contents = turns.map((turn) => ({
    role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: turn.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: MODEL_ID,
    contents,
    config: {
      systemInstruction: EMERGENCY_ASSISTANT_SYSTEM_PROMPT,
      maxOutputTokens: lowBandwidth ? 300 : 800,
    },
  });

  for await (const chunk of stream) {
    if (chunk.promptFeedback?.blockReason) {
      yield "\n\nI can't help with that request. If you're in immediate danger, call Police 100 or National Emergency 1149.";
      return;
    }
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
