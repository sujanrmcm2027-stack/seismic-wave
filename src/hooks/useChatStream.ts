import { useCallback, useRef, useState } from "react";
import { streamChatReply } from "@/lib/chatbot/serverFns";
import { buildNearbySafeZonesBlock, LOW_BANDWIDTH_NOTE } from "@/lib/chatbot/systemPrompt";
import type { SafeZone } from "@/data/evacuationZones";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  status: "streaming" | "done" | "error";
};

type SendMessageOptions = {
  lowBandwidth: boolean;
  nearestZones: (SafeZone & { distanceKm: number | null })[];
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // Full conversation so far, in the plain { role, content } shape the
  // server forwards straight into the Anthropic `messages` array.
  const historyRef = useRef<{ role: ChatRole; content: string }[]>([]);

  const sendMessage = useCallback(async (rawText: string, options: SendMessageOptions) => {
    const text = rawText.trim();
    if (!text) return;

    // The live nearest-zones ranking (already computed by EvacuationMap's
    // Haversine pass) and the low-bandwidth flag ride along as user-turn
    // context rather than mutating the system prompt, so the frozen system
    // prompt stays cache-friendly across requests.
    const contextBlocks = [
      buildNearbySafeZonesBlock(options.nearestZones),
      options.lowBandwidth ? LOW_BANDWIDTH_NOTE : "",
    ].filter(Boolean);
    const messageForModel = contextBlocks.length ? `${contextBlocks.join("\n")}\n\n${text}` : text;

    const userMessage: ChatMessage = { id: makeId(), role: "user", content: text, status: "done" };
    const assistantId = makeId();

    historyRef.current = [...historyRef.current, { role: "user", content: messageForModel }];
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", status: "streaming" },
    ]);
    setIsStreaming(true);

    try {
      const response = await streamChatReply({
        data: { turns: historyRef.current, lowBandwidth: options.lowBandwidth },
      });
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response had no readable body");

      const decoder = new TextDecoder();
      let fullText = "";

      // Reads UTF-8 bytes off the network as they arrive and appends each
      // chunk to the assistant bubble immediately — this loop is the whole
      // mechanism that makes the reply feel instant instead of waiting for
      // the full response before showing anything.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)),
        );
      }

      historyRef.current = [...historyRef.current, { role: "assistant", content: fullText }];
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, status: "done" } : m)),
      );
    } catch (error) {
      // The bubble always shows the calm public-facing fallback — the real
      // cause (missing API key, network failure, quota, etc.) goes to the
      // console instead, so a developer can tell those apart without
      // guessing. The server also logs "Server Fn Error!" with the same
      // error to its own terminal.
      console.error("Chat request failed:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Couldn't reach the assistant. If this is urgent, call Police 100 or National Emergency 1149.",
                status: "error",
              }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage };
}
