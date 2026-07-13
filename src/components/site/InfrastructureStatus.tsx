import { useState, useEffect } from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import { Clock } from "lucide-react";

type StatusLevel = "open" | "partial" | "closed";

type InfraItem = {
  name: string;
  nameNe: string;
  status: StatusLevel;
  detail?: string;
};

type HospitalItem = InfraItem & { beds: number; bedsTotal: number };

const DEFAULT_ROADS: InfraItem[] = [
  { name: "Prithvi Highway (KTM–Pokhara)", nameNe: "पृथ्वी राजमार्ग", status: "partial", detail: "Slow at Malekhu" },
  { name: "Tribhuvan Highway (KTM–Hetauda)", nameNe: "त्रिभुवन राजमार्ग", status: "open" },
  { name: "Araniko Highway (KTM–Kodari)", nameNe: "अरनिको राजमार्ग", status: "open" },
  { name: "BP Highway (Hetauda–Dharan)", nameNe: "बीपी राजमार्ग", status: "open" },
  { name: "Siddhartha Highway (Pokhara–Butwal)", nameNe: "सिद्धार्थ राजमार्ग", status: "open" },
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

// ─── Status badge helpers ─────────────────────────────────────────────────────

function StatusBadge({ status, lang }: { status: StatusLevel; lang: "en" | "ne" }) {
  const cfg = {
    open: {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    },
    partial: {
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    },
    closed: {
      dot: "bg-red-500 animate-pulse",
      text: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold tracking-wider uppercase ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`infra.${status}`, lang)}
    </span>
  );
}

// ─── Section sub-component ────────────────────────────────────────────────────

function InfraSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-2 font-bold">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InfrastructureStatus() {
  const { lang } = useCrisisMode();
  
  const [roads, setRoads] = useState<InfraItem[]>(DEFAULT_ROADS);
  const [airports, setAirports] = useState<InfraItem[]>(DEFAULT_AIRPORTS);
  const [hospitals, setHospitals] = useState<HospitalItem[]>(DEFAULT_HOSPITALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!SCRIPT_URL) return;

    setLoading(true);
    fetch(`${SCRIPT_URL}?action=get_infra`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return; // Keep defaults if totally empty
        
        const fetchedRoads: InfraItem[] = [];
        const fetchedAirports: InfraItem[] = [];
        const fetchedHospitals: HospitalItem[] = [];

        data.forEach(item => {
          const cat = item.category.toLowerCase();
          if (cat === 'road') fetchedRoads.push(item);
          else if (cat === 'airport') fetchedAirports.push(item);
          else if (cat === 'hospital') fetchedHospitals.push(item);
        });

        setRoads(fetchedRoads);
        setAirports(fetchedAirports);
        setHospitals(fetchedHospitals);
      })
      .catch(err => console.error("Failed to fetch live infrastructure data:", err))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section
      aria-label="Live infrastructure status"
      className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-surface/60 border-b border-border px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
            {t("infra.title", lang)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("infra.subtitle", lang)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {loading && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1" />}
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px]">{now} NPT</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 grid md:grid-cols-3 gap-6">
        {/* Roads */}
        <InfraSection title={t("infra.roads", lang)}>
          {roads.length === 0 && <div className="text-xs text-muted-foreground italic">No data</div>}
          {roads.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {lang === "ne" ? r.nameNe : r.name}
                </div>
                {r.detail && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{r.detail}</div>
                )}
              </div>
              <StatusBadge status={r.status} lang={lang} />
            </div>
          ))}
        </InfraSection>

        {/* Airports */}
        <InfraSection title={t("infra.airports", lang)}>
          {airports.length === 0 && <div className="text-xs text-muted-foreground italic">No data</div>}
          {airports.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {lang === "ne" ? a.nameNe : a.name}
                </div>
                {a.detail && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{a.detail}</div>
                )}
              </div>
              <StatusBadge status={a.status} lang={lang} />
            </div>
          ))}
        </InfraSection>

        {/* Hospitals */}
        <InfraSection title={t("infra.hospitals", lang)}>
          {hospitals.length === 0 && <div className="text-xs text-muted-foreground italic">No data</div>}
          {hospitals.map((h, i) => {
            const pct = Math.round((h.beds / h.bedsTotal) * 100);
            const barColor =
              pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";
            return (
              <div
                key={i}
                className="py-1.5 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-medium text-foreground truncate">
                    {lang === "ne" ? h.nameNe : h.name}
                  </div>
                  <StatusBadge status={h.status} lang={lang} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {h.beds} {t("infra.beds", lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </InfraSection>
      </div>

      {/* Footer disclaimer */}
      <div className="px-5 py-2.5 bg-surface/40 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-mono text-center">
          ⚠ {t("infra.source", lang)}
        </p>
      </div>
    </section>
  );
}
