import { useCallback, useRef, useState } from "react";

import { buildNearbySafeZonesBlock, LOW_BANDWIDTH_NOTE } from "@/lib/chatbot/systemPrompt";
import { getLocalReply } from "@/lib/chatbot/knowledgeBase";
import type { SafeZone } from "@/data/evacuationZones";
import { syncChatMessage } from "@/services/dataService";


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

// ── Chat history persistence ──────────────────────────────────────────
const CHAT_HISTORY_KEY = "chat_history";
const CHAT_MAX = 100; // messages kept across sessions

function loadChatHistory(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) ?? "[]") as ChatMessage[];
  } catch {
    return [];
  }
}

function saveChatHistory(messages: ChatMessage[]) {
  // Only save "done" messages (not streaming placeholders)
  const toSave = messages
    .filter((m) => m.status === "done" || m.status === "error")
    .slice(0, CHAT_MAX);
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
  } catch {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave.slice(0, CHAT_MAX / 2)));
    } catch { /* give up */ }
  }
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_HISTORY_KEY);
}


// Simulates streaming by revealing the reply character-by-character so the
// chat bubble animates naturally instead of popping in all at once.
async function* fakeStream(text: string, lowBandwidth: boolean): AsyncGenerator<string> {
  if (lowBandwidth) {
    yield text;
    return;
  }
  // Stream word-by-word for a natural feel
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield (i === 0 ? "" : " ") + words[i];
    // Slight pause every few words to feel natural
    if (i % 6 === 5) {
      await new Promise((r) => setTimeout(r, 30));
    }
  }
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());
  const [isStreaming, setIsStreaming] = useState(false);
  const historyRef = useRef<{ role: ChatRole; content: string }[]>(
    // Restore conversation history for the AI context too
    loadChatHistory().map((m) => ({ role: m.role, content: m.content }))
  );

  // Helper that updates state AND persists atomically
  const setAndSave = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      saveChatHistory(next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (rawText: string, options: SendMessageOptions) => {
    const text = rawText.trim();
    if (!text) return;

    // Build context-enriched message (nearest zones + low-bandwidth flag)
    const contextBlocks = [
      buildNearbySafeZonesBlock(options.nearestZones),
      options.lowBandwidth ? LOW_BANDWIDTH_NOTE : "",
    ].filter(Boolean);
    const enrichedText = contextBlocks.length
      ? `${contextBlocks.join("\n")}\n\n${text}`
      : text;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      status: "done",
    };
    const assistantId = makeId();

    historyRef.current = [...historyRef.current, { role: "user", content: enrichedText }];
    setAndSave((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", status: "streaming" },
    ]);
    setIsStreaming(true);
    void syncChatMessage("user", text);

    try {
      // Get the reply from the local knowledge base (no API, always works)
      const reply = getLocalReply(text);

      let fullText = "";
      for await (const chunk of fakeStream(reply, options.lowBandwidth)) {
        fullText += chunk;
        const snap = fullText;
        // Don't persist during streaming — just update state
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snap } : m)),
        );
      }

      historyRef.current = [...historyRef.current, { role: "assistant", content: fullText }];
      // Persist once streaming is done
      setAndSave((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, status: "done" } : m)),
      );
      void syncChatMessage("assistant", fullText);
    } catch (error) {

      console.error("Chat error:", error);
      setAndSave((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Something went wrong. For emergencies, call Police 100 or National Emergency 1149.",
                status: "error",
              }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage, setAndSave };
}
