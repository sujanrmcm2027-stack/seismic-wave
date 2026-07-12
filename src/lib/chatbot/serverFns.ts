import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { streamAssistantReply } from "@/lib/chatbot/geminiClient.server";

const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const chatRequestSchema = z.object({
  turns: z.array(chatTurnSchema).min(1),
  lowBandwidth: z.boolean(),
});

// Returns a raw Response whose body is the live token stream from
// streamAssistantReply — createServerFn passes a Response straight through
// instead of JSON-serializing it, so the client gets the same
// ReadableStream it would from a native fetch() to a streaming endpoint.
export const streamChatReply = createServerFn({ method: "POST" })
  .validator(chatRequestSchema)
  .handler(async ({ data }) => {
    const body = streamAssistantReply({ turns: data.turns, lowBandwidth: data.lowBandwidth });
    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  });
