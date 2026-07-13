import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import { useLiveNepalEarthquakes } from "@/hooks/useLiveNepalEarthquakes";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

export function CrisisBar() {
  const { liteMode, toggleLiteMode, lang, toggleLang } = useCrisisMode();
  const { latestEvent, loading, error, lastUpdatedAt, dataSource } = useLiveNepalEarthquakes();

  const isCritical = (latestEvent?.magnitude ?? 0) >= 5.0;
  const isWarn = (latestEvent?.magnitude ?? 0) >= 4.0;

  const statusColor = isCritical
    ? "bg-red-600 text-white"
    : isWarn
      ? "bg-amber-500 text-black"
      : "bg-emerald-700 text-white";

  const dotColor = isCritical
    ? "bg-white animate-ping"
    : isWarn
      ? "bg-black/50 animate-pulse"
      : "bg-emerald-300 animate-pulse";

  return (
    <div
      role="banner"
      aria-label="Crisis response dashboard control bar"
      className={`sticky top-0 z-[70] w-full ${statusColor} shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-10 flex items-center gap-3">
        {/* LEFT — live status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCritical ? "bg-white" : isWarn ? "bg-amber-200" : "bg-emerald-300"
              }`}
            />
          </span>
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase hidden sm:inline">
            {t("crisisbar.live", lang)}
          </span>
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase sm:hidden">
            LIVE
          </span>
        </div>

        {/* divider */}
        <div className="h-4 w-px bg-current opacity-30 shrink-0" />

        {/* data source badge */}
        {dataSource && (
          <span className="hidden md:inline font-mono text-[9px] tracking-wider opacity-70 uppercase">
            {t(`status.source_${dataSource}`, lang)}
          </span>
        )}

        {/* offline indicator */}
        {error && !loading && (
          <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider opacity-80 uppercase">
            <WifiOff className="w-3 h-3" />
            {t("banner.offline", lang)}
          </span>
        )}

        {/* CENTRE — spacer pushes toggles right on mobile */}
        <div className="flex-1" />

        {/* Last updated */}
        {lastUpdatedAt && (
          <span className="hidden lg:inline font-mono text-[9px] opacity-70 tracking-wide shrink-0">
            {t("banner.updated", lang)}: {lastUpdatedAt.toLocaleTimeString("en-NP", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" })} NPT
          </span>
        )}

        {/* LITE MODE TOGGLE */}
        <button
          onClick={toggleLiteMode}
          aria-pressed={liteMode}
          title={t("crisisbar.lite_hint", lang)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] font-bold tracking-wider uppercase border transition-all shrink-0 ${
            liteMode
              ? "bg-white/20 border-white/40 shadow-inner"
              : "bg-white/10 border-white/20 hover:bg-white/20"
          }`}
        >
          <span className="text-[11px]">⚡</span>
          <span className="hidden xs:inline">
            {liteMode ? t("crisisbar.lite_on", lang) : t("crisisbar.lite_off", lang)}
          </span>
          <span className="xs:hidden">{liteMode ? "LITE ✓" : "LITE"}</span>
        </button>

        {/* LANGUAGE TOGGLE */}
        <button
          onClick={toggleLang}
          aria-label={`Switch language to ${lang === "en" ? "Nepali" : "English"}`}
          className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold tracking-widest uppercase border border-white/20 bg-white/10 hover:bg-white/20 transition-all shrink-0"
        >
          {lang === "en" ? "नेपाली" : "EN"}
        </button>
      </div>

      {/* CRITICAL banner sub-line */}
      {isCritical && (
        <div className="bg-red-800/80 text-white text-center py-1 font-mono text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-3 h-3 animate-pulse" />
          {t("status.red", lang)}
          <AlertTriangle className="w-3 h-3 animate-pulse" />
        </div>
      )}
    </div>
  );
}
