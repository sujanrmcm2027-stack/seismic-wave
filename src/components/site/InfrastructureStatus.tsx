import { useState, useEffect, useRef, useMemo } from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { t } from "@/lib/i18n/translations";
import {
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Car,
  Plane,
  Building2,
  Layers,
  ArrowRight,
  Download,
} from "lucide-react";
import { archiveRoadIncident, triggerDownload } from "@/services/firebase";

const DOR_LIVE_URL = "https://navigate.dor.gov.np/app/dashboard";

export type StatusLevel = "open" | "partial" | "closed";

export type InfraItem = {
  category?: "road" | "airport" | "hospital";
  name: string;
  nameNe: string;
  status: StatusLevel;
  detail?: string;
  beds?: number;
  bedsTotal?: number;
  lastUpdated?: string;
};

export type HospitalItem = InfraItem & { beds: number; bedsTotal: number };

// ─── Default road data reflects current DOR status ───────────────────────────
const DEFAULT_ROADS: InfraItem[] = [
  { name: "NH01 – Mahendra Rajmarg", nameNe: "महेन्द्र राजमार्ग", status: "partial", detail: "Heavy Rainfall at Binayee Tribeni-2, Nawalparasi East" },
  { name: "NH02 – Mechi Rajmarg", nameNe: "मेची राजमार्ग", status: "open" },
  { name: "NH03 – Puspalal Hwy (Mid-Hill)", nameNe: "पुष्पलाल राजमार्ग", status: "partial", detail: "Landslide at Kanthekhola-6, Baglung" },
  { name: "NH04 – Birtamod-Chandragadhi", nameNe: "विर्तामोड–चन्द्रगढी", status: "open" },
  { name: "NH05 – Postal Hwy", nameNe: "हुलाकी राजमार्ग", status: "open" },
  { name: "NH06 – Koshi Rajmarg", nameNe: "कोशी राजमार्ग", status: "open" },
  { name: "NH08 – Sagarmatha Rajmarg", nameNe: "सगरमाथा राजमार्ग", status: "open" },
  { name: "NH09 – Madan Bhandari Hwy", nameNe: "मदन भण्डारी राजमार्ग", status: "open" },
  { name: "NH10 – Siddhartha Hwy", nameNe: "सिद्धार्थ राजमार्ग", status: "open" },
  { name: "NH11 – Rapti Rajmarg", nameNe: "राप्ती राजमार्ग", status: "open" },
  { name: "NH12 – Ratna Rajmarg", nameNe: "रत्न राजमार्ग", status: "open" },
  { name: "NH13 – Karnali Rajmarg", nameNe: "कर्णाली राजमार्ग", status: "partial", detail: "Heavy Rainfall at Roshi-9, Kavrepalanchok" },
  { name: "NH14 – Mahakali Rajmarg", nameNe: "महाकाली राजमार्ग", status: "open" },
  { name: "NH15 – Seti Rajmarg", nameNe: "सेती राजमार्ग", status: "open" },
  { name: "NH16 – Rapti-Lumbini Hwy", nameNe: "राप्ती–लुम्बिनी राजमार्ग", status: "open" },
  { name: "NH34 – Araniko Hwy", nameNe: "अरनिको राजमार्ग", status: "open" },
  { name: "NH38 – BP Hwy", nameNe: "बीपी राजमार्ग", status: "open" },
  { name: "NH41 – Tribhuvan Hwy", nameNe: "त्रिभुवन राजमार्ग", status: "partial", detail: "Landslide at Bhimphedi-9, Makwanpur" },
  { name: "NH42 – Prithvi Hwy", nameNe: "पृथ्वी राजमार्ग", status: "partial", detail: "GLOF from Rasuwagadhi-Timure at Galchi-6, Dhading" },
  { name: "NH43 – Narayanghat-Mugling", nameNe: "नारायणगढ–मुग्लिन", status: "open" },
];

const DEFAULT_AIRPORTS: InfraItem[] = [
  { name: "Tribhuvan Intl (KTM)", nameNe: "त्रिभुवन विमानस्थल", status: "open", detail: "Normal operations" },
  { name: "Gautam Buddha Intl (BWA)", nameNe: "गौतम बुद्ध विमानस्थल", status: "open" },
  { name: "Pokhara Regional (PKR)", nameNe: "पोखरा विमानस्थल", status: "open" },
  { name: "Bharatpur (BHR)", nameNe: "भरतपुर विमानस्थल", status: "open" },
  { name: "Dhangadhi (DHI)", nameNe: "धनगढी विमानस्थल", status: "open" },
  { name: "Biratnagar (BIR)", nameNe: "विराटनगर विमानस्थल", status: "open" },
  { name: "Nepalgunj (KEP)", nameNe: "नेपालगञ्ज विमानस्थल", status: "open" },
  { name: "Chandragadhi (BDP)", nameNe: "चन्द्रगढी विमानस्थल", status: "open" },
  { name: "Janakpur (JKR)", nameNe: "जनकपुर विमानस्थल", status: "open" },
  { name: "Simara (SIF)", nameNe: "सिमरा विमानस्थल", status: "open" },
];

const DEFAULT_HOSPITALS: HospitalItem[] = [
  { name: "Bir Hospital, Kathmandu", nameNe: "बीर अस्पताल", status: "open", beds: 120, bedsTotal: 390 },
  { name: "TU Teaching Hospital", nameNe: "त्रिवि शिक्षण अस्पताल", status: "open", beds: 95, bedsTotal: 600 },
  { name: "Patan Hospital, Lalitpur", nameNe: "पाटन अस्पताल", status: "open", beds: 60, bedsTotal: 300 },
  { name: "Manipal College Hospital", nameNe: "मणिपाल अस्पताल", status: "open", beds: 45, bedsTotal: 150 },
  { name: "Gandaki Medical College, Pokhara", nameNe: "गण्डकी अस्पताल", status: "open", beds: 38, bedsTotal: 200 },
];

const REFRESH_MS = 15 * 60 * 1000; // 15 minutes

export function InfrastructureStatus() {
  const { lang } = useCrisisMode();

  const [roads, setRoads] = useState<InfraItem[]>(DEFAULT_ROADS);
  const [airports, setAirports] = useState<InfraItem[]>(DEFAULT_AIRPORTS);
  const [hospitals, setHospitals] = useState<HospitalItem[]>(DEFAULT_HOSPITALS);
  const [activeTab, setActiveTab] = useState<"roads" | "airports" | "hospitals" | "all">("roads");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(new Date());
  const [minsAgo, setMinsAgo] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyItems = (items: any[]) => {
    const r: InfraItem[] = [], a: InfraItem[] = [], h: HospitalItem[] = [];
    items.forEach((item) => {
      const cat = item.category?.toLowerCase();
      if (cat === "road") r.push({ ...item, category: "road" });
      else if (cat === "airport") a.push({ ...item, category: "airport" });
      else if (cat === "hospital") h.push({ ...item, category: "hospital" });
    });
    if (r.length) {
      setRoads(r);
      // Auto-archive active road incidents into Firebase Firestore for study
      try {
        r.forEach((road) => {
          if (road.status === "closed" || road.status === "partial" || road.detail) {
            const nhMatch = road.name.match(/^(NH\d+)/);
            archiveRoadIncident({
              highwayCode: nhMatch ? nhMatch[1] : "ROAD",
              highwayName: road.name,
              highwayNameNe: road.nameNe,
              status: road.status,
              detail: road.detail,
              timestampNpt: new Date().toLocaleString("en-NP", { timeZone: "Asia/Kathmandu" }),
              sourceUrl: DOR_LIVE_URL,
            });
          }
        });
      } catch (e) {
        console.debug("[Archive] Road archiving:", e);
      }
    }
    if (a.length) setAirports(a);
    if (h.length) setHospitals(h);
    setLastFetched(new Date());
    setMinsAgo(0);
  };

  const fetchInfra = () => {
    const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    setLoading(true);

    const fromJson: Promise<any[]> = fetch("/infra_status.json?t=" + Date.now(), { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => (Array.isArray(d?.items) && d.items.length > 0 ? d.items : Promise.reject("empty json")));

    const fromScript: Promise<any[]> = SCRIPT_URL
      ? fetch(`${SCRIPT_URL}?action=get_infra`, { cache: "no-store" })
          .then((res) => res.json())
          .then((d) => (Array.isArray(d) && d.length > 0 ? d : Promise.reject("empty script")))
      : Promise.reject("no script url");

    fromJson
      .catch(() => fromScript)
      .then((items) => {
        if (items?.length) applyItems(items);
      })
      .catch((err) => console.error("Infrastructure data fallback:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInfra();
    intervalRef.current = setInterval(fetchInfra, REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  // Road counts for summary
  const closedCount = useMemo(() => roads.filter((r) => r.status === "closed").length, [roads]);
  const partialCount = useMemo(() => roads.filter((r) => r.status === "partial").length, [roads]);
  const openCount = useMemo(() => roads.filter((r) => r.status === "open").length, [roads]);

  // Current NPT time
  const nowNpt = new Date().toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Combine & filter dataset
  const filteredItems = useMemo(() => {
    let list: (InfraItem & { type: "road" | "airport" | "hospital" })[] = [];

    if (activeTab === "roads" || activeTab === "all") {
      list.push(...roads.map((r) => ({ ...r, type: "road" as const })));
    }
    if (activeTab === "airports" || activeTab === "all") {
      list.push(...airports.map((a) => ({ ...a, type: "airport" as const })));
    }
    if (activeTab === "hospitals" || activeTab === "all") {
      list.push(...hospitals.map((h) => ({ ...h, type: "hospital" as const })));
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.nameNe && item.nameNe.toLowerCase().includes(q)) ||
          (item.detail && item.detail.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [activeTab, statusFilter, searchQuery, roads, airports, hospitals]);

  return (
    <section
      aria-label="Live infrastructure status"
      className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden flex flex-col h-full w-full"
    >
      {/* ── 1. HEADER (Compact, Responsive) ────────────────────────── */}
      <div className="bg-surface/70 border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wider uppercase text-primary font-bold">
              {t("infra.title", lang)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t("infra.subtitle", lang)}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 bg-surface-2/80 px-2 py-1 rounded border border-border/60">
            <Clock className="w-3 h-3 text-primary" />
            <span>{nowNpt} NPT</span>
            {minsAgo !== null && (
              <span className="text-muted-foreground/60 ml-0.5">
                ({minsAgo === 0 ? "just now" : `${minsAgo}m ago`})
              </span>
            )}
          </span>

          <button
            onClick={fetchInfra}
            disabled={loading}
            title="Refresh status feed"
            aria-label="Refresh status feed"
            className="p-1 rounded bg-surface-2 hover:bg-surface border border-border/60 transition-colors text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            onClick={() => {
              const headers = "Category,Name,NameNepali,Status,Detail,Timestamp\n";
              const rows = [
                ...roads.map((r) => `"Road","${r.name}","${r.nameNe || ""}","${r.status}","${(r.detail || "").replace(/"/g, '""')}","${nowNpt}"`),
                ...airports.map((a) => `"Airport","${a.name}","${a.nameNe || ""}","${a.status}","${(a.detail || "").replace(/"/g, '""')}","${nowNpt}"`),
                ...hospitals.map((h) => `"Hospital","${h.name}","${h.nameNe || ""}","${h.status}","${h.beds} / ${h.bedsTotal} beds","${nowNpt}"`),
              ].join("\n");
              triggerDownload(headers + rows, `nepal_infrastructure_log_${Date.now()}.csv`);
            }}
            title="Export CSV for Google Sheets or Excel"
            aria-label="Export CSV for Google Sheets or Excel"
            className="flex items-center gap-1 px-2 py-1 rounded bg-surface-2 hover:bg-surface border border-border/80 text-foreground text-[10px] font-mono transition-colors"
          >
            <Download className="w-3 h-3 text-primary" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <a
            href={DOR_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 transition-colors"
          >
            <span>DOR</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── 2. DOR LIVE SUMMARY ALERT BAR ──────────────────────────── */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-2 text-xs shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-amber-800 dark:text-amber-300">
          <span className="font-semibold text-[11px] uppercase tracking-wide">
            {lang === "ne" ? "सडक विभाग (DOR) अवस्था:" : "DOR Highway Status:"}
          </span>
          <a
            href={DOR_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-primary underline hover:text-foreground inline-flex items-center gap-0.5"
          >
            navigate.dor.gov.np
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span
            onClick={() => {
              setActiveTab("roads");
              setStatusFilter("closed");
            }}
            className={`cursor-pointer px-2 py-0.5 rounded font-semibold transition-colors ${
              statusFilter === "closed" && activeTab === "roads"
                ? "bg-red-600 text-white"
                : "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25"
            }`}
          >
            {closedCount} ✕ {t("infra.closed", lang)}
          </span>
          <span
            onClick={() => {
              setActiveTab("roads");
              setStatusFilter("partial");
            }}
            className={`cursor-pointer px-2 py-0.5 rounded font-semibold transition-colors ${
              statusFilter === "partial" && activeTab === "roads"
                ? "bg-amber-600 text-white"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
            }`}
          >
            {partialCount} ◐ {t("infra.partial", lang)}
          </span>
          <span
            onClick={() => {
              setActiveTab("roads");
              setStatusFilter("open");
            }}
            className={`cursor-pointer px-2 py-0.5 rounded font-semibold transition-colors ${
              statusFilter === "open" && activeTab === "roads"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
            }`}
          >
            {openCount} ✓ {t("infra.open", lang)}
          </span>
        </div>
      </div>

      {/* ── 3. UNIVERSAL CATEGORY TABS & FILTER CONTROLS ───────────── */}
      <div className="p-3 border-b border-border bg-surface/30 space-y-2.5 shrink-0">
        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-surface-2 rounded-lg text-xs font-mono font-medium">
          <button
            onClick={() => setActiveTab("roads")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all text-center ${
              activeTab === "roads"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t("infra.roads", lang)}</span>
            <span className="text-[10px] opacity-75">({roads.length})</span>
            {partialCount + closedCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("airports")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all text-center ${
              activeTab === "airports"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plane className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t("infra.airports", lang)}</span>
            <span className="text-[10px] opacity-75">({airports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hospitals")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all text-center ${
              activeTab === "hospitals"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t("infra.hospitals", lang)}</span>
            <span className="text-[10px] opacity-75">({hospitals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all text-center ${
              activeTab === "all"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">All</span>
            <span className="text-[10px] opacity-75">
              ({roads.length + airports.length + hospitals.length})
            </span>
          </button>
        </div>

        {/* Search Bar & Status Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={lang === "ne" ? "सडक, विमानस्थल वा अस्पताल खोज्नुहोस्..." : "Filter roads, airports, hospitals..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
            <span className="text-muted-foreground mr-1 hidden sm:inline">Status:</span>
            {(["all", "closed", "partial", "open"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setStatusFilter(lvl)}
                className={`px-2 py-1 rounded transition-colors uppercase font-semibold ${
                  statusFilter === lvl
                    ? lvl === "closed"
                      ? "bg-red-600 text-white"
                      : lvl === "partial"
                      ? "bg-amber-600 text-white"
                      : lvl === "open"
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground"
                    : "bg-surface hover:bg-surface-2 text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. SCROLLABLE CONTENT VIEWPORT ──────────────────────────── */}
      <div className="p-3 flex-1 min-h-0 overflow-y-auto space-y-2 divide-y-0">
        {filteredItems.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {lang === "ne" ? "कुनै पूर्वाधार फेला परेन" : "No infrastructure records match"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {lang === "ne"
                ? "कृपया खोज शब्द वा फिल्टर परिवर्तन गर्नुहोस्।"
                : "Try adjusting your search query or status filter to see available reports."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-3 px-3 py-1 text-xs font-mono rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isRoad = item.type === "road";
            const isAirport = item.type === "airport";
            const isHospital = item.type === "hospital";

            // Extract Highway code if starts with NH
            const nhMatch = item.name.match(/^(NH\d+)/);
            const nhCode = nhMatch ? nhMatch[1] : null;

            // Accent color based on status
            const statusBorder =
              item.status === "closed"
                ? "border-l-4 border-l-red-500"
                : item.status === "partial"
                ? "border-l-4 border-l-amber-500"
                : "border-l-4 border-l-emerald-500";

            return (
              <div
                key={`${item.type}_${item.name}_${idx}`}
                className={`p-2.5 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-colors ${statusBorder}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {nhCode && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border text-primary shrink-0">
                          {nhCode}
                        </span>
                      )}
                      {isAirport && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                          AIRPORT
                        </span>
                      )}
                      {isHospital && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                          HOSPITAL
                        </span>
                      )}
                      <h4 className="text-xs font-semibold text-foreground leading-snug">
                        {lang === "ne" && item.nameNe ? item.nameNe : item.name}
                      </h4>
                    </div>

                    {/* Condition / Warning Detail */}
                    {item.detail ? (
                      <div
                        className={`text-[11px] mt-1 flex items-start gap-1 leading-snug ${
                          item.status === "closed"
                            ? "text-red-700 dark:text-red-300 font-medium"
                            : item.status === "partial"
                            ? "text-amber-800 dark:text-amber-300 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {(item.status === "closed" || item.status === "partial") && (
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                        )}
                        <span>{item.detail}</span>
                      </div>
                    ) : null}

                    {/* Hospital Bed Availability Progress */}
                    {isHospital && item.beds !== undefined && item.bedsTotal !== undefined && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>
                            {item.beds} / {item.bedsTotal} {t("infra.beds", lang)}
                          </span>
                          <span>{Math.round((item.beds / item.bedsTotal) * 100)}% Available</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.beds / item.bedsTotal > 0.4
                                ? "bg-emerald-500"
                                : item.beds / item.bedsTotal > 0.2
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.round((item.beds / item.bedsTotal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator Badge */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.status === "closed"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                          : item.status === "partial"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {item.status === "closed" && <XCircle className="w-2.5 h-2.5 shrink-0" />}
                      {item.status === "partial" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                      {item.status === "open" && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                      {t(`infra.${item.status}`, lang)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 5. FOOTER ──────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-surface/50 border-t border-border flex items-center justify-between gap-2 shrink-0 text-[10px] font-mono text-muted-foreground">
        <span className="truncate">
          ⚠ {t("infra.source", lang)}
        </span>
        <a
          href={DOR_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary underline hover:text-foreground font-semibold inline-flex items-center gap-0.5"
        >
          <span>DOR Portal</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </section>
  );
}
