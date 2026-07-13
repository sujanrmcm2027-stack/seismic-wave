import { AlertTriangle, WifiOff } from "lucide-react";
import { useLiveNepalEarthquakes } from "@/hooks/useLiveNepalEarthquakes";
import { formatRelativeShort, useLiveAdvisories } from "@/hooks/useLiveAdvisories";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const CRITICAL_MAGNITUDE = 5.0;

export function AlertBanner() {
  const { latestEvent, lastUpdatedAt } = useLiveNepalEarthquakes();
  const {
    advisories,
    isOffline,
    isCritical: feedIsCritical,
    now,
  } = useLiveAdvisories();
  const { lang } = useCrisisMode();

  const isCritical = (latestEvent?.magnitude ?? 0) > CRITICAL_MAGNITUDE || feedIsCritical;

  // Build the primary message to display (static — no marquee)
  const primaryMessage = latestEvent
    ? `M${latestEvent.magnitude.toFixed(1)} · ${latestEvent.place} · ${latestEvent.depth.toFixed(0)} km depth`
    : advisories[0]?.message ?? t("banner.monitoring", lang);

  const category = latestEvent
    ? "EARTHQUAKE"
    : advisories[0]?.category?.toUpperCase() ?? "STATUS";

  const updatedAgo = lastUpdatedAt ? formatRelativeShort(lastUpdatedAt, now) : null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "w-full border-b transition-colors duration-500",
        isCritical
          ? "bg-red-700 text-white border-red-900 animate-critical-flash"
          : "bg-surface text-foreground border-border",
      )}
    >
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-2 md:py-1.5 flex flex-wrap md:flex-nowrap items-start md:items-center gap-x-4 gap-y-1">

        {/* Label badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 shrink-0 font-mono text-[10px] tracking-[0.2em] font-bold uppercase whitespace-nowrap",
            isCritical ? "text-white" : "text-primary",
          )}
        >
          <AlertTriangle
            className={cn("w-3.5 h-3.5", isCritical ? "animate-pulse" : "opacity-70")}
          />
          {isCritical ? t("banner.critical", lang) : t("banner.live_advisory", lang)}
        </div>

        <div
          className={cn(
            "hidden md:block h-4 w-px shrink-0",
            isCritical ? "bg-white/30" : "bg-border",
          )}
        />

        {/* Category pill */}
        <span
          className={cn(
            "shrink-0 font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded border",
            isCritical
              ? "border-white/30 bg-white/10 text-white"
              : "border-primary/30 bg-primary/10 text-primary",
          )}
        >
          {category}
        </span>

        {/* Static message — full width, always visible */}
        <p
          className={cn(
            "flex-1 text-xs font-medium leading-snug min-w-0",
            isCritical ? "text-white" : "text-foreground",
          )}
        >
          {primaryMessage}
        </p>

        {/* Additional advisories count */}
        {advisories.length > 1 && (
          <span
            className={cn(
              "shrink-0 font-mono text-[9px] opacity-70 whitespace-nowrap",
              isCritical ? "text-white" : "text-muted-foreground",
            )}
          >
            +{advisories.length - 1} more advisories
          </span>
        )}

        {/* Divider */}
        <div
          className={cn(
            "hidden md:block h-4 w-px shrink-0",
            isCritical ? "bg-white/30" : "bg-border",
          )}
        />

        {/* Timestamp — always visible, no chase needed */}
        <div
          className={cn(
            "flex items-center gap-1.5 shrink-0 font-mono text-[10px] whitespace-nowrap",
            isCritical ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {isOffline && <WifiOff className="w-3 h-3" />}
          {updatedAgo
            ? `${t("banner.updated", lang)}: ${updatedAgo}`
            : t("banner.monitoring", lang).slice(0, 30)}
        </div>
      </div>
    </div>
  );
}
