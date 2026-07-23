import { useEffect, useState } from "react";
import { Building2, Home, MapPin, Route, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import type {
  DamageIncident,
  IncidentCategory,
  VerificationStatus,
} from "@/data/damageAssessment2026";

const CATEGORY_ICON: Record<IncidentCategory, typeof Building2> = {
  "Structural Failure": Building2,
  "Road Blockage": Route,
  Landslide: TriangleAlert,
  "Casualty Report": Users,
  Displacement: Home,
};

const BADGE_STYLE: Record<VerificationStatus, string> = {
  official: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  media: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  unverified: "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300/90",
};

const CARD_STYLE: Record<VerificationStatus, string> = {
  official: "border-emerald-500/25 bg-emerald-500/[0.04]",
  media: "border-amber-500/25 bg-amber-500/[0.04]",
  unverified: "border-border bg-muted/30",
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "official") {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide ${BADGE_STYLE.official}`}
      >
        🟢 Verified Official
      </span>
    );
  }
  if (status === "media") {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide ${BADGE_STYLE.media}`}
      >
        🟡 Media Verified
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide ${BADGE_STYLE.unverified}`}
    >
      🔴 Unverified Report
    </span>
  );
}

function formatTimeAgo(time: string, now: number) {
  const diffMs = now - new Date(time).getTime();
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));
  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function parseIncidentDetail(detail: string) {
  let url = null;
  // Require a closing quote to ensure the URL wasn't truncated mid-string
  const urlMatch = detail.match(/href="([^">]+)"/);
  if (urlMatch) {
    url = urlMatch[1];
  }
  
  // Remove HTML tags (even if truncated and unclosed)
  let text = detail.replace(/<[^>]*>?/gm, "").trim();
  
  return { text, url };
}

export function DamageIncidentFeed({ incidents }: { incidents: DamageIncident[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(tick);
  }, []);

  const sorted = [...incidents].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  return (
    <aside
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-label="Real-time incident feed"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Real-Time Incident Feed
          </div>
          <div className="text-sm font-semibold text-foreground">
            Rumor filter · verification protocol
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> Live
        </span>
      </div>

      <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4 lg:max-h-[560px]">
        {sorted.map((incident) => {
          const CategoryIcon = CATEGORY_ICON[incident.category];
          return (
            <article
              key={incident.id}
              className={`animate-fade-up rounded-lg border p-3 shadow-sm ${CARD_STYLE[incident.verification]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {incident.phase} · {incident.category}
                </div>
                <VerificationBadge status={incident.verification} />
              </div>

              <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">
                {incident.headline}
              </h3>
              {(() => {
                const { text, url } = parseIncidentDetail(incident.detail);
                return (
                  <div className="mt-1">
                    {text && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {text}
                      </p>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        Read more
                      </a>
                    )}
                  </div>
                );
              })()}

              {incident.verification === "unverified" && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Awaiting ground verification
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {incident.place}
                </span>
                <span className="font-mono">{incident.source}</span>
                <span className="font-mono">{formatTimeAgo(incident.time, now)}</span>
              </div>
            </article>
          );
        })}

        {!sorted.length && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No incidents match this filter yet.
          </div>
        )}
      </div>
    </aside>
  );
}
