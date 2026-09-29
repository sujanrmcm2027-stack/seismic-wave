import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Database,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { triggerDownload } from "@/services/firebase";

export function ResearchDataExportModal() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (url: string, filename: string, key: string) => {
    try {
      setDownloading(key);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const text = await res.text();
      triggerDownload(text, filename, url.endsWith(".json") ? "application/json" : "text/csv");
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      window.open(url, "_blank");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-surface/40 to-surface border p-6 md:p-8 mt-12 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">
              Academic & Research Data Hub
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Open Disaster Data
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 text-foreground">
            Complete Historical Records & Google Sheets Archive
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Every 15-minute road update, verified disaster incident, authentic news report, and multi-source
            tremor since 2026 is preserved for free scientific research, policy analysis, and community resilience.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 font-mono text-xs text-muted-foreground bg-surface-2 px-3 py-2 rounded-lg border border-border">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Updated Daily at 12:00 AM Midnight NPT</span>
        </div>
      </div>

      {/* Dataset Download Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Dataset 1: Road Updates History */}
        <div className="rounded-lg border border-border bg-card/80 p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-2 border border-border">
                27,939 Rows
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">DOR Road Status Log</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every 15-minute highway update, landslide blockage, and monsoon disruption from July 2026 to present.
            </p>
          </div>

          <button
            onClick={() => downloadFile("/infra_history.csv", "nepal_road_infra_history_2026.csv", "roads")}
            disabled={downloading === "roads"}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-primary text-primary-foreground font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === "roads" ? "Preparing CSV..." : "Download CSV (27k rows)"}</span>
          </button>
        </div>

        {/* Dataset 2: Verified News & Incidents */}
        <div className="rounded-lg border border-border bg-card/80 p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-2 border border-border">
                9,253 Rows
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Verified Incidents & News</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Disaster reports and authentic news logs from BIPAD, NDRRMA, Kathmandu Post, NDTV with lat/lng coordinates.
            </p>
          </div>

          <button
            onClick={() => downloadFile("/incidents_history.csv", "nepal_incidents_news_history_2026.csv", "incidents")}
            disabled={downloading === "incidents"}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-primary text-primary-foreground font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === "incidents" ? "Preparing CSV..." : "Download CSV (9.2k rows)"}</span>
          </button>
        </div>

        {/* Dataset 3: Multi-Source Seismic Catalog */}
        <div className="rounded-lg border border-border bg-card/80 p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-2 border border-border">
                424 Events
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Seismic Tremors Catalog</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every earthquake & tremor recorded in Nepal with magnitude, depth, coordinates, and verification agencies.
            </p>
          </div>

          <button
            onClick={() => downloadFile("/seismic_tremors_history.csv", "nepal_seismic_tremors_master_catalog.csv", "tremors")}
            disabled={downloading === "tremors"}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-primary text-primary-foreground font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === "tremors" ? "Preparing CSV..." : "Download Tremors CSV (424 events)"}</span>
          </button>
        </div>

        {/* Dataset 4: Nationwide Evacuation Safe Zones */}
        <div className="rounded-lg border border-border bg-card/80 p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-2 border border-border">
                157 Zones
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Evacuation Safe Zones GIS</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              GeoJSON dataset of all 157 designated open evacuation grounds across all 7 provinces for QGIS/ArcGIS.
            </p>
          </div>

          <button
            onClick={() => downloadFile("/fallback_safe_zones.json", "nepal_safe_zones_nationwide.geojson", "safe_zones")}
            disabled={downloading === "safe_zones"}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-primary text-primary-foreground font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === "safe_zones" ? "Preparing..." : "Download GeoJSON"}</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Multi-Tab Guide Box */}
      <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">
              Google Sheets Multi-Tab Auto-Sync Architecture
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data is organized into 7 distinct sheets:{" "}
            <span className="font-mono font-medium text-foreground">Seismic_Tremors</span>,{" "}
            <span className="font-mono font-medium text-foreground">Roads_Live</span>,{" "}
            <span className="font-mono font-medium text-foreground">Roads_YYYY_MM</span> (monthly archives),{" "}
            <span className="font-mono font-medium text-foreground">Verified_News</span>,{" "}
            <span className="font-mono font-medium text-foreground">Citizen_Help_&_Safety</span>,{" "}
            <span className="font-mono font-medium text-foreground">Municipal_Damage_DDNA</span>, and{" "}
            <span className="font-mono font-medium text-foreground">GoBag_Downloads</span>.
          </p>
        </div>

        <a
          href="https://sheets.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-xs font-mono font-bold text-foreground hover:bg-surface-2 transition-colors shadow-sm"
        >
          <span>Open Google Sheets</span>
          <ExternalLink className="w-3.5 h-3.5 text-primary" />
        </a>
      </div>
    </section>
  );
}
