import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bot, MessageCircle, Phone, Send, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { useChatStream, clearChatHistory, type ChatMessage } from "@/hooks/useChatStream";
import { useSafeZones } from "@/hooks/useSafeZones";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineDistanceKm } from "@/lib/geo/haversine";
import { EMERGENCY_ASSISTANT_NAME } from "@/lib/chatbot/systemPrompt";

const EMERGENCY_CONTACTS = [
  ["Police", "100"],
  ["Fire Brigade", "101"],
  ["Ambulance", "102"],
  ["National Emergency", "1149"],
];

const QUICK_REPLIES = [
  {
    label: "Nearest Safe Zone",
    prompt: "What is the nearest safe zone to my current location, and how far is it?",
  },
  {
    label: "First Aid Basics",
    prompt: "Give me basic first aid steps for common earthquake injuries.",
  },
  {
    label: "Report Damage",
    prompt: "How do I report earthquake damage in my area?",
  },
  {
    label: "Preparedness Tips",
    prompt: "What earthquake preparedness activities, drills, or checklist items should I know about?",
  },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isStreaming, sendMessage, setAndSave } = useChatStream();
  const { zones } = useSafeZones();
  const { position } = useGeolocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleClearHistory() {
    clearChatHistory();
    setAndSave(() => []);
  }

  // Reuses the same Haversine ranking as EvacuationMap so "nearest safe
  // zone" in chat matches what the map/sidebar shows, rather than the
  // model guessing from training data.
  const nearestZones = useMemo(() => {
    if (!position) return [];
    return zones
      .map((zone) => ({ ...zone, distanceKm: haversineDistanceKm(position, zone) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [zones, position]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: lowBandwidth ? "auto" : "smooth",
    });
  }, [messages, lowBandwidth]);

  function handleSend(text: string) {
    setInput("");
    void sendMessage(text, { lowBandwidth, nearestZones });
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg hover:opacity-95"
          aria-label="Open emergency assistant chat"
        >
          <MessageCircle className="h-5 w-5" />
          {EMERGENCY_ASSISTANT_NAME}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Emergency assistant chat"
          className="fixed bottom-24 right-5 z-50 flex h-[70vh] max-h-[600px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-surface/70 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {EMERGENCY_ASSISTANT_NAME}
                </div>
                <div className="text-[11px] text-muted-foreground">Earthquake assistant</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Clear history button */}
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  title="Clear chat history"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive transition-colors"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {/* High-visibility Emergency button */}
              <button
                onClick={() => setShowEmergency(true)}
                className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90"
              >
                <Phone className="h-3.5 w-3.5" /> Emergency
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {lowBandwidth ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              Low-Bandwidth Mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={lowBandwidth}
              onClick={() => setLowBandwidth((value) => !value)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                lowBandwidth ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  lowBandwidth ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  I&apos;m {EMERGENCY_ASSISTANT_NAME}, your earthquake safety assistant. Ask me
                  anything, or pick a quick option:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((quickReply) => (
                    <button
                      key={quickReply.label}
                      onClick={() => handleSend(quickReply.prompt)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2"
                    >
                      {quickReply.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} lowBandwidth={lowBandwidth} />
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about safety, first aid, or safe zones…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {showEmergency && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur"
          onClick={() => setShowEmergency(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-xl text-foreground">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Emergency Contacts
              </h3>
              <button onClick={() => setShowEmergency(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <ul className="divide-y divide-border">
              {EMERGENCY_CONTACTS.map(([name, number]) => (
                <li key={name} className="flex items-center justify-between py-3">
                  <span className="text-foreground/90">{name}</span>
                  <a href={`tel:${number}`} className="font-mono text-primary hover:underline">
                    {number}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

// Lightweight markdown → JSX renderer (no external lib needed)
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const [header, , ...rows] = tableBuffer;
    const headers = header.split("|").map((h) => h.trim()).filter(Boolean);
    nodes.push(
      <table key={nodes.length} className="w-full text-xs border-collapse my-1">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-border/40 px-2 py-1 text-left bg-surface/60 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.split("|").map((c) => c.trim()).filter(Boolean).map((c, ci) => (
                <td key={ci} className="border border-border/40 px-2 py-1">
                  {inlineFormat(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
    tableBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (line.trim().startsWith("|")) {
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    // Heading (## or ###)
    if (/^#{2,3}\s/.test(line)) {
      nodes.push(<p key={i} className="font-semibold text-foreground mt-2 mb-0.5">{inlineFormat(line.replace(/^#{2,3}\s/, ""))}</p>);
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      nodes.push(
        <div key={i} className="flex gap-2">
          <span className="shrink-0 font-mono text-primary">{line.match(/^(\d+\.)/)?.[1]}</span>
          <span>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    }
    // Bullet list
    else if (/^[-*]\s/.test(line)) {
      nodes.push(
        <div key={i} className="flex gap-2">
          <span className="shrink-0 text-primary mt-0.5">•</span>
          <span>{inlineFormat(line.replace(/^[-*]\s/, ""))}</span>
        </div>
      );
    }
    // Blank line
    else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      nodes.push(<p key={i} className="leading-snug">{inlineFormat(line)}</p>);
    }
  }
  flushTable();
  return nodes;
}

// Handles **bold** and `code` inline
function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-surface/80 rounded px-0.5 font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function ChatBubble({ message, lowBandwidth }: { message: ChatMessage; lowBandwidth: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!lowBandwidth && !isUser && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm space-y-0.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : message.status === "error"
              ? "border border-destructive/30 bg-destructive/10 text-destructive"
              : "bg-surface text-foreground"
        }`}
      >
        {isUser
          ? <span className="whitespace-pre-wrap">{message.content}</span>
          : renderMarkdown(message.content)
        }
        {message.status === "streaming" && !lowBandwidth && (
          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
        )}
        {message.status === "streaming" && lowBandwidth && !message.content && (
          <span className="text-muted-foreground">…</span>
        )}
      </div>
    </div>
  );
}
