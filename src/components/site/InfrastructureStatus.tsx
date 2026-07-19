import { useState, useEffect, useRef } from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import { Clock, ExternalLink } from "lucide-react";

const DOR_LIVE_URL = "https://navigate.dor.gov.np/app/dashboard";

type StatusLevel = "open" | "partial" | "closed";

type InfraItem = {
  name: string;
  nameNe: string;
  status: StatusLevel;
  detail?: string;
};

type HospitalItem = InfraItem & { beds: number; bedsTotal: number };

// ─── Default road data reflects current DOR status (monsoon season) ───────────
// Source: navigate.dor.gov.np — 8 closed, 12 partial, 42 open out of 62 total
const DEFAULT_ROADS: InfraItem[] = [
  { name: "Prithvi Hwy (KTM–Pokhara)", nameNe: "पृथ्वी राजमार्ग", status: "partial", detail: "Slow at Malekhu" },
  { name: "Tribhuvan Hwy (KTM–Hetauda)", nameNe: "त्रिभुवन राजमार्ग", status: "partial", detail: "Reduced lanes, Bhimphedi" },
  { name: "Araniko Hwy (KTM–Kodari)", nameNe: "अरनिको राजमार्ग", status: "partial", detail: "Landslide risk zones" },
  { name: "NH02 – Mechi Rajmarg", nameNe: "NH02 – मेची राजमार्ग", status: "closed", detail: "Landslide since Jul 9" },
  { name: "BP Hwy (Hetauda–Dharan)", nameNe: "बीपी राजमार्ग", status: "partial", detail: "One-way sections" },
  { name: "Siddhartha Hwy (Pokhara–Butwal)", nameNe: "सिद्धार्थ राजमार्ग", status: "open", detail: "NH47 reopened" },
  { name: "Mid-Hill Hwy (Karnali)", nameNe: "मध्यपहाडी लोकमार्ग", status: "closed", detail: "Multiple landslides" },
  { name: "Kakarbhitta–Itahari Road", nameNe: "काकरभिट्टा–इटहरी सडक", status: "open" },
];

const DEFAULT_AIRPORTS: InfraItem[] = [
  { name: "Tribhuvan Intl (KTM)", nameNe: "त्रिभुवन विमानस्थल", status: "open", detail: "Normal operations" },
  { name: "Pokhara Regional (PKR)", nameNe: "पोखरा विमानस्थल", status: "open" },
  { name: "Bharatpur (BHR)", nameNe: "भरतपुर विमानस्थल", status: "open" },
  { name: "Dhangadhi (DHI)", nameNe: "धनगढी विमानस्थल", status: "open" },
  { name: "Biratnagar (BIR)", nameNe: "विराटनगर विमानस्थल", status: "open" },
];

const DEFAULT_HOSPITALS: HospitalItem[] = [
  { name: "Bir Hospital, Kathmandu", nameNe: "बीर अस्पताल", status: "open", beds: 120, bedsTotal: 390 },
  { name: "TU Teaching Hospital", nameNe: "त्रिवि शिक्षण अस्पताल", status: "open", beds: 95, bedsTotal: 600 },
  { name: "Patan Hospital, Lalitpur", nameNe: "पाटन अस्पताल", status: "open", beds: 60, bedsTotal: 300 },
  { name: "Manipal College Hospital", nameNe: "मणिपाल अस्पताल", status: "open", beds: 45, bedsTotal: 150 },
  { name: "Gandaki Medical College, Pokhara", nameNe: "गण्डकी अस्पताल", status: "open", beds: 38, bedsTotal: 200 },
];

// ─── Status dot (compact, no pill) ───────────────────────────────────────────

const DOT: Record<StatusLevel, string> = {
  open:    "bg-emerald-500",
  partial: "bg-amber-500 animate-pulse",
  closed:  "bg-red-500 animate-pulse",
};

const LABEL_COLOR: Record<StatusLevel, string> = {
  open:    "text-emerald-600 dark:text-emerald-400",
  partial: "text-amber-600 dark:text-amber-400",
  closed:  "text-red-600 dark:text-red-400",
};

function StatusDot({ status, lang }: { status: StatusLevel; lang: "en" | "ne" }) {
  return (
    <span className={`inline-flex items-center gap-1 shrink-0 font-mono text-[10px] font-bold tracking-wider uppercase ${LABEL_COLOR[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[status]}`} />
      {t(`infra.${status}`, lang)}
    </span>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground/70 uppercase mb-2 font-bold border-b border-border/40 pb-1.5">
      {title}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const REFRESH_MS = 15 * 60 * 1000; // 15 minutes

export function InfrastructureStatus() {
  const { lang } = useCrisisMode();

  const [roads, setRoads]           = useState<InfraItem[]>(DEFAULT_ROADS);
  const [airports, setAirports]     = useState<InfraItem[]>(DEFAULT_AIRPORTS);
  const [hospitals, setHospitals]   = useState<HospitalItem[]>(DEFAULT_HOSPITALS);
  const [loading, setLoading]       = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [minsAgo, setMinsAgo]       = useState<number | null>(null);
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyItems = (items: any[]) => {
    const r: InfraItem[] = [], a: InfraItem[] = [], h: HospitalItem[] = [];
    items.forEach(item => {
      const cat = item.category?.toLowerCase();
      if (cat === "road")          r.push(item);
      else if (cat === "airport")  a.push(item);
      else if (cat === "hospital") h.push(item);
    });
    if (r.length) setRoads(r);
    if (a.length) setAirports(a);
    if (h.length) setHospitals(h);
    setLastFetched(new Date());
  };

  const fetchInfra = () => {
    const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    setLoading(true);

    // Priority 1: /infra_status.json — auto-updated by GitHub Actions
    const fromJson: Promise<any[]> = fetch("/infra_status.json?t=" + Date.now(), { cache: "no-store" })
      .then(r => r.json())
      .then(d => (Array.isArray(d?.items) && d.items.length > 0 ? d.items : Promise.reject("empty json")));

    // Priority 2: Apps Script (if configured)
    const fromScript: Promise<any[]> = SCRIPT_URL
      ? fetch(`${SCRIPT_URL}?action=get_infra`, { cache: "no-store" })
          .then(r => r.json())
          .then(d => (Array.isArray(d) && d.length > 0 ? d : Promise.reject("empty script")))
      : Promise.reject("no script url");

    fromJson
      .catch(() => fromScript)
      .then(items => { if (items.length) applyItems(items); })
      .catch(err => console.error("Infrastructure data unavailable:", err))
      .finally(() => setLoading(false));
  };

  // Initial fetch + 15-min polling interval
  useEffect(() => {
    fetchInfra();
    intervalRef.current = setInterval(fetchInfra, REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Tick "X min ago" label every minute
  useEffect(() => {
    if (!lastFetched) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - lastFetched.getTime()) / 60000);
      setMinsAgo(diff);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [lastFetched]);

  const closed  = roads.filter(r => r.status === "closed").length;
  const partial = roads.filter(r => r.status === "partial").length;
  const open    = roads.filter(r => r.status === "open").length;

  const now = new Date().toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section
      aria-label="Live infrastructure status"
      className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden flex flex-col h-full"
    >
      {/* ── Header ── */}
      <div className="bg-surface/60 border-b border-border px-5 py-3 flex items-center justify-between gap-3 shrink-0">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
            {t("infra.title", lang)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t("infra.subtitle", lang)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {loading && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Fetching latest data…" />}
          <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
            <Clock className="w-3 h-3" />
            {now} NPT
          </span>
          {minsAgo !== null && (
            <span className="font-mono text-[9px] text-muted-foreground/50" title="Time since last data check">
              {minsAgo === 0 ? "just now" : `${minsAgo}m ago`}
            </span>
          )}
          <a
            href={DOR_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-400/25 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-semibold hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            DOR
          </a>
        </div>
      </div>

      {/* ── DOR notice: single tight row ── */}
      <div className="bg-amber-50/70 dark:bg-amber-950/15 border-b border-amber-200/60 dark:border-amber-800/30 px-5 py-1.5 flex items-center gap-3 flex-wrap shrink-0">
        <span className="text-[10px] text-amber-700 dark:text-amber-400">
          {lang === "ne"
            ? `DOR: ${closed} बन्द · ${partial} आंशिक —`
            : `DOR: ${closed} closed · ${partial} partial —`}
        </span>
        <a
          href={DOR_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          navigate.dor.gov.np →
        </a>
        <div className="ml-auto flex items-center gap-1.5 font-mono text-[9px]">
          <span className="text-red-600 dark:text-red-400 font-semibold">{closed}✕</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{partial}◑</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{open}✓</span>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="p-5 grid md:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Roads */}
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0 mb-2">
            <SectionLabel title={t("infra.roads", lang)} />
          </div>
          <div className="space-y-0 overflow-y-auto pr-2 flex-1 min-h-0">
            {roads.length === 0 && <p className="text-[11px] text-muted-foreground italic">No data</p>}
            {roads.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-2.5 border-b border-border/30 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-medium text-foreground leading-tight">
                    {lang === "ne" ? r.nameNe : r.name}
                  </div>
                  {r.detail && (
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                      {r.detail}
                    </div>
                  )}
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusDot status={r.status} lang={lang} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Airports */}
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0 mb-2">
            <SectionLabel title={t("infra.airports", lang)} />
          </div>
          <div className="space-y-0 overflow-y-auto pr-2 flex-1 min-h-0">
            {airports.length === 0 && <p className="text-[11px] text-muted-foreground italic">No data</p>}
            {airports.map((a, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-2.5 border-b border-border/30 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-medium text-foreground leading-tight">
                    {lang === "ne" ? a.nameNe : a.name}
                  </div>
                  {a.detail && (
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                      {a.detail}
                    </div>
                  )}
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusDot status={a.status} lang={lang} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospitals */}
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0 mb-2">
            <SectionLabel title={t("infra.hospitals", lang)} />
          </div>
          <div className="space-y-0 overflow-y-auto pr-2 flex-1 min-h-0">
            {hospitals.length === 0 && <p className="text-[11px] text-muted-foreground italic">No data</p>}
            {hospitals.map((h, i) => {
              const pct = Math.round((h.beds / h.bedsTotal) * 100);
              const bar = pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={i} className="py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-[11.5px] font-medium text-foreground leading-tight line-clamp-1">
                      {lang === "ne" ? h.nameNe : h.name}
                    </div>
                    <div className="shrink-0 mt-0.5">
                      <StatusDot status={h.status} lang={lang} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground shrink-0 min-w-[48px] text-right">
                      {h.beds} {t("infra.beds", lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-2 bg-surface/30 border-t border-border/50 shrink-0">
        <p className="text-[9px] text-muted-foreground/60 font-mono">
          ⚠ {t("infra.source", lang)}
        </p>
      </div>
    </section>
  );
}
