/**
 * ParticipantTrustBar — a sticky, live counter strip that shows
 * the number of participants who have reported in.
 *
 * Numbers come from Google Sheets (via dataService) and refresh
 * every 60 s. Privacy: no names, locations, or personal data
 * are shown — only the aggregate counts.
 */
import { usePublicCounts } from "@/hooks/usePublicCounts";
import { CheckCircle2, AlertTriangle, Zap, MessageCircle, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Animated count-up on first render / value change */
function AnimCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const step = 16;
    const steps = Math.round(duration / step);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(Math.round(start + (end - start) * (i / steps)));
      if (i >= steps) { clearInterval(timer); prevRef.current = end; }
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

export function ParticipantTrustBar() {
  const { counts, loading } = usePublicCounts();

  const totalParticipants = counts.safeCount + counts.helpCount;

  const stats = [
    {
      Icon  : Users,
      value : totalParticipants,
      label : "Participants",
      color : "text-primary",
      bg    : "bg-primary/10",
      tip   : "People who have submitted a safety report",
    },
    {
      Icon  : CheckCircle2,
      value : counts.safeCount,
      label : "Safe",
      color : "text-emerald-500",
      bg    : "bg-emerald-500/10",
      tip   : "Confirmed safe reports",
    },
    {
      Icon  : AlertTriangle,
      value : counts.helpCount,
      label : "Need Help",
      color : "text-red-500",
      bg    : "bg-red-500/10",
      tip   : "People requesting assistance",
    },
    {
      Icon  : Zap,
      value : counts.dyfiCount,
      label : "DYFI Reports",
      color : "text-amber-500",
      bg    : "bg-amber-500/10",
      tip   : "Did You Feel It? intensity submissions",
    },
    {
      Icon  : MessageCircle,
      value : counts.chatCount,
      label : "Chat Sessions",
      color : "text-violet-500",
      bg    : "bg-violet-500/10",
      tip   : "Emergency assistant queries answered",
    },
  ];

  if (loading && totalParticipants === 0) return null;

  return (
    <div className="w-full border-b border-border bg-surface/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {/* Label */}
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mr-3 hidden sm:block">
            Community Activity
          </span>

          {/* Live dot */}
          <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] text-muted-foreground mr-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>

          {/* Stats */}
          <div className="flex items-center gap-1 divide-x divide-border/60">
            {stats.map(({ Icon, value, label, color, bg, tip }) => (
              <div
                key={label}
                title={tip}
                className="flex items-center gap-1.5 px-3 first:pl-0 cursor-default"
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className={`h-3 w-3 ${color}`} />
                </div>
                <span className={`font-bold text-sm tabular-nums ${color}`}>
                  <AnimCount value={value} />
                </span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden md:block">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Trust message */}
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground hidden lg:block">
            Data saved to Google Sheets · refreshes every 60 s
          </span>
        </div>
      </div>
    </div>
  );
}
