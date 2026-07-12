import { AlertTriangle, Radio, WifiOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveNepalEarthquakes } from "@/hooks/useLiveNepalEarthquakes";
import { formatRelativeShort, useLiveAdvisories } from "@/hooks/useLiveAdvisories";

// Any Nepal-region event above this magnitude flips the banner into the
// high-contrast critical state, regardless of what the advisories feed says.
const CRITICAL_MAGNITUDE = 5.0;

export function AlertBanner() {
  const { latestEvent } = useLiveNepalEarthquakes();
  const {
    advisories,
    lastUpdatedAt,
    isOffline,
    isCritical: feedIsCritical,
    now,
  } = useLiveAdvisories();

  const isCritical = (latestEvent?.magnitude ?? 0) > CRITICAL_MAGNITUDE || feedIsCritical;
  const [isPaused, setIsPaused] = useState(false);

  const tickerMessages = [
    ...(latestEvent
      ? [
          `EARTHQUAKE · M${latestEvent.magnitude.toFixed(1)} recorded ${latestEvent.place}, ${latestEvent.depth.toFixed(0)} km depth`,
        ]
      : []),
    ...advisories.map((a) => `${a.category.toUpperCase()} · ${a.message}`),
  ];
  const loopedMessages = [...tickerMessages, ...tickerMessages];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative border-b transition-colors duration-500",
        isCritical
          ? "bg-destructive text-destructive-foreground border-destructive/60 animate-critical-flash"
          : "bg-surface text-foreground border-border",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center gap-3 overflow-hidden">
        <div
          className={cn(
            "flex items-center gap-2 shrink-0 font-mono text-[10px] tracking-[0.2em] font-semibold uppercase",
            !isCritical && "text-primary",
          )}
        >
          <AlertTriangle
            className={cn("w-3.5 h-3.5", isCritical ? "animate-pulse" : "opacity-70")}
          />
          {isCritical ? "Critical Alert" : "Live Advisory"}
        </div>

        <div
          className={cn(
            "hidden sm:block h-4 w-px shrink-0",
            isCritical ? "bg-destructive-foreground/30" : "bg-border",
          )}
        />

        <div
          className="flex-1 min-w-0 overflow-hidden relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className={cn(
              "flex gap-12 whitespace-nowrap text-xs font-medium",
              isCritical ? "animate-marquee-fast" : "animate-marquee",
            )}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {loopedMessages.map((message, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <Radio className="w-3 h-3 opacity-70" />
                {message}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 shrink-0 font-mono text-[10px] tracking-wider opacity-80">
          {isOffline && <WifiOff className="w-3 h-3" />}
          {lastUpdatedAt
            ? `Last updated: ${formatRelativeShort(lastUpdatedAt, now)}`
            : "System operational, monitoring active"}
        </div>
      </div>
    </div>
  );
}
