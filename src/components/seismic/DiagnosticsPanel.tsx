/**
 * DiagnosticsPanel.tsx — System Health & Data Quality Monitoring Panel
 * ======================================================================
 * Implements Section 20:
 * - Real-time operational status for NEMRC, CENC, and USGS
 * - Records processed, latency, last fetch timestamp
 * - Ingestion error and outage logging
 * - Correlation and matching decision audit trail
 */

import { useState, useEffect } from "react";
import type { DiagnosticsSummary, SourceAgency } from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import { getSeismicDiagnostics, refreshMultiSourceFeed } from "@/lib/seismic/serverFns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

export function DiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"sources" | "matching" | "errors">("sources");

  const fetchDiagnostics = async () => {
    try {
      const data = await getSeismicDiagnostics();
      setDiagnostics(data);
    } catch (e) {
      console.warn("Diagnostics fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      await refreshMultiSourceFeed();
      await fetchDiagnostics();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDiagnostics();
    const timer = setInterval(() => void fetchDiagnostics(), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !diagnostics) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm font-mono text-muted-foreground animate-pulse">
        Polling seismic ingestion telemetry and diagnostics…
      </div>
    );
  }

  const agencies: SourceAgency[] = ["NEMRC", "CENC", "USGS"];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-surface/80 px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Seismic Feed Diagnostics & Pipeline Telemetry
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Live monitoring of external government interfaces, correlation decisions, and outages
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-mono text-foreground hover:bg-surface/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing All Sources…" : "Trigger Pipeline Resync"}
        </button>
      </div>

      {/* ── SUB-NAVIGATION TABS ──────────────────────────────────────── */}
      <div className="flex border-b border-border bg-surface/40 px-5 gap-4 text-xs font-mono">
        <button
          onClick={() => setActiveTab("sources")}
          className={`py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "sources"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Agency Status ({diagnostics?.availableSourceCount ?? 3}/3 Online)
        </button>
        <button
          onClick={() => setActiveTab("matching")}
          className={`py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "matching"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Matching Audit Log ({diagnostics?.matchingDecisionsLog.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("errors")}
          className={`py-2.5 border-b-2 font-semibold transition-colors ${
            activeTab === "errors"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Error & Outage Log ({diagnostics?.errorLog.length ?? 0})
        </button>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      <div className="p-5">
        {activeTab === "sources" && diagnostics && (
          <div className="grid md:grid-cols-3 gap-4">
            {agencies.map((agency) => {
              const meta = AGENCY_METADATA[agency];
              const health = diagnostics.sources[agency];
              const isOnline = health.status === "ONLINE";
              const isDegraded = health.status === "DEGRADED";

              return (
                <div
                  key={agency}
                  className="rounded-lg border border-border bg-surface/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.flag}</span>
                      <div>
                        <div className="font-bold text-sm text-foreground">{meta.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {meta.role.split(" ")[0]} Network
                        </div>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isOnline
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : isDegraded
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isOnline ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </>
                      ) : isDegraded ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          DEGRADED
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          OFFLINE
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-muted-foreground border-t border-border/60 pt-2.5">
                    <div className="flex justify-between">
                      <span>Endpoint:</span>
                      <span className="truncate max-w-[150px] text-foreground text-[10px]" title={health.endpointUrl}>
                        {health.endpointUrl.replace("https://", "")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="text-foreground">{health.latencyMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records Processed:</span>
                      <span className="font-bold text-foreground">{health.recordsProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consecutive Errors:</span>
                      <span className={health.consecutiveErrors > 0 ? "text-red-400 font-bold" : "text-foreground"}>
                        {health.consecutiveErrors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="text-[10px] text-foreground">
                        {health.lastSuccessfulFetch ? new Date(health.lastSuccessfulFetch).toLocaleTimeString() : "Pending"}
                      </span>
                    </div>
                  </div>

                  {health.lastErrorMessage && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-400 leading-snug">
                      {health.lastErrorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "matching" && diagnostics && (
          <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto pr-1">
            {diagnostics.matchingDecisionsLog.length ? (
              diagnostics.matchingDecisionsLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-surface/60 border border-border flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <GitBranch className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-foreground">{log.action}: {log.eventGroupId}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{log.summary}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No matching decisions recorded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "errors" && diagnostics && (
          <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto pr-1">
            {diagnostics.errorLog.length ? (
              diagnostics.errorLog.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        [{err.source}] {err.message}
                      </span>
                      <span className="text-[10px] opacity-75">
                        {new Date(err.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {err.details && (
                      <div className="text-[11px] opacity-85 mt-1 font-mono">{err.details}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>Zero unhandled pipeline exceptions. All adapters operating within specification.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
