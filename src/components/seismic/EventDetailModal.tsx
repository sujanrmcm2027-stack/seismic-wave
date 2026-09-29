/**
 * EventDetailModal.tsx — Deep Cross-Verification & Provenance Modal
 * ===================================================================
 * Implements Section 11 & 12:
 * - Source comparison table (NEMRC vs CENC vs USGS)
 * - Spatial distance comparison matrix (km)
 * - Temporal origin-time comparison matrix (seconds)
 * - Magnitude scale characteristics and comparability analysis
 * - Full revision history tracking (never overwriting historical values)
 * - Official source provenance links
 */

import { useState } from "react";
import type { MultiSourceEventGroup, SourceAgency } from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  GitCommit,
  Globe,
  History,
  Layers,
  MapPin,
  Maximize2,
  Radio,
  ShieldAlert,
  X,
  Zap,
} from "lucide-react";

interface EventDetailModalProps {
  group: MultiSourceEventGroup | null;
  onClose: () => void;
  formatNpt: (d: Date | number) => string;
  formatUtc: (d: Date | number) => string;
  formatTimeAgo: (d: Date | number, now: number) => string;
  now: number;
}

export function EventDetailModal({
  group,
  onClose,
  formatNpt,
  formatUtc,
  formatTimeAgo,
  now,
}: EventDetailModalProps) {
  if (!group) return null;

  const a = group.assessment;
  const agencies: SourceAgency[] = ["NEMRC", "CENC", "USGS"];

  // Collect all revisions across reporting agencies
  const allRevisions = agencies.flatMap((agency) => {
    const obs = group.observations[agency];
    if (!obs || !obs.revisions || !obs.revisions.length) return [];
    return obs.revisions.map((rev) => ({
      ...rev,
      agency,
    }));
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* ── MODAL HEADER ────────────────────────────────────────────── */}
        <div className="bg-surface/90 px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary uppercase">
                  Event Cross-Verification Audit
                </span>
                <span className="font-mono text-[10px] text-muted-foreground bg-surface border border-border px-1.5 py-0.5 rounded">
                  Group ID: {group.eventGroupId}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                {a.primaryPlaceName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-surface/60 p-3 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Representative Mag
              </span>
              <span className="font-serif text-2xl font-bold text-foreground">
                ~{a.representativeMagnitude.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Spread: {a.magnitudeRange.spread.toFixed(1)}
              </span>
            </div>

            <div className="bg-surface/60 p-3 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Agreement Level
              </span>
              <span className="text-base font-bold text-foreground block mt-1">
                {a.agreementLevel === "HIGH" && "🟢 HIGH"}
                {a.agreementLevel === "MODERATE" && "🟡 MODERATE"}
                {a.agreementLevel === "LOW" && "🟠 LOW"}
                {a.agreementLevel === "INSUFFICIENT_DATA" && "⚪ INSUFFICIENT"}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Score: {a.dataConsistencyScore}/100
              </span>
            </div>

            <div className="bg-surface/60 p-3 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Coverage
              </span>
              <span className="text-base font-bold text-foreground block mt-1">
                {a.sourceCount} / {a.totalTrackedSources} Agencies
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {a.sourcesReporting.join(", ")}
              </span>
            </div>

            <div className="bg-surface/60 p-3 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Consensus Origin
              </span>
              <span className="text-xs font-bold text-foreground block mt-1 truncate">
                {formatNpt(a.consensusOriginTimeMs)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {formatTimeAgo(a.consensusOriginTimeMs, now)}
              </span>
            </div>
          </div>

          {/* ── SECTION 1: SOURCE COMPARISON TABLE ─────────────────────── */}
          <div>
            <h3 className="font-serif text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Source Parameter Comparison Table
            </h3>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-surface/80 border-b border-border">
                    <th className="p-3 font-semibold text-muted-foreground uppercase text-[10px]">
                      Parameter
                    </th>
                    {agencies.map((agency) => {
                      const meta = AGENCY_METADATA[agency];
                      return (
                        <th key={agency} className="p-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{meta.flag}</span>
                            <span>{meta.name}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground font-normal">
                            {meta.role.split(" ")[0]} perspective
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Magnitude</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 font-bold text-sm text-foreground">
                          {obs ? `${obs.magnitudeValue.toFixed(1)} ${obs.magnitudeType}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Magnitude Type</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-muted-foreground">
                          {obs ? (
                            <span>
                              <span className="text-foreground font-semibold">{obs.magnitudeType}</span>{" "}
                              {obs.magnitudeType === "ML" && "(Local Richter)"}
                              {obs.magnitudeType === "mb" && "(Body wave)"}
                              {obs.magnitudeType === "Ms" && "(Surface wave)"}
                              {obs.magnitudeType.toLowerCase().startsWith("mw") && "(Moment magnitude)"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Coordinates</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-foreground">
                          {obs ? `${obs.latitude.toFixed(3)}°N, ${obs.longitude.toFixed(3)}°E` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Depth</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-foreground">
                          {obs ? (obs.depthKm !== null ? `${obs.depthKm} km` : "Unconstrained") : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Origin Time (NPT)</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-muted-foreground text-[11px]">
                          {obs ? formatNpt(obs.originTimeMs) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Origin Time (UTC)</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-muted-foreground text-[11px]">
                          {obs ? formatUtc(obs.originTimeMs) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Event ID</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3 text-primary font-bold">
                          {obs ? obs.sourceEventId : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground font-semibold">Official Link</td>
                    {agencies.map((agency) => {
                      const obs = group.observations[agency];
                      return (
                        <td key={agency} className="p-3">
                          {obs ? (
                            <a
                              href={obs.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-[11px]"
                            >
                              Verify at source
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECTION 2: SPATIAL & TEMPORAL COMPARISON ────────────────── */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Spatial Epicenter Dispersal */}
            <div className="bg-surface/40 p-4 rounded-xl border border-border">
              <h4 className="font-serif font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                Spatial Epicenter Dispersal
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Great-circle distance between reported coordinates from contributing networks:
              </p>
              {a.spatialAgreement.pairwiseDistances.length ? (
                <div className="space-y-2 font-mono text-xs">
                  {a.spatialAgreement.pairwiseDistances.map((pair, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-card border border-border/60"
                    >
                      <span>
                        {AGENCY_METADATA[pair.from].flag} {pair.from} ↔{" "}
                        {AGENCY_METADATA[pair.to].flag} {pair.to}
                      </span>
                      <span className="font-bold text-foreground">{pair.distanceKm.toFixed(1)} km</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground text-right pt-1">
                    Maximum separation: {a.spatialAgreement.maxDistanceKm} km
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Single source reporting — pairwise distance calculation requires ≥ 2 sources.
                </div>
              )}
            </div>

            {/* Temporal Origin-Time Delta */}
            <div className="bg-surface/40 p-4 rounded-xl border border-border">
              <h4 className="font-serif font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Temporal Origin-Time Differences
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Difference in seconds between origin times calculated by network travel-time inversion:
              </p>
              {a.temporalAgreement.pairwiseDeltasSec.length ? (
                <div className="space-y-2 font-mono text-xs">
                  {a.temporalAgreement.pairwiseDeltasSec.map((pair, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-card border border-border/60"
                    >
                      <span>
                        {AGENCY_METADATA[pair.from].flag} {pair.from} ↔{" "}
                        {AGENCY_METADATA[pair.to].flag} {pair.to}
                      </span>
                      <span className="font-bold text-foreground">Δ {pair.deltaSec} seconds</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground text-right pt-1">
                    Maximum time delta: {a.temporalAgreement.maxDeltaSec}s
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Single source reporting — origin time difference requires ≥ 2 sources.
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: REVISION HISTORY AUDIT TRAIL ─────────────────── */}
          <div className="bg-surface/40 p-4 rounded-xl border border-border">
            <h4 className="font-serif font-bold text-foreground text-sm mb-2 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Event Revision History Audit Trail
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Earthquake parameters undergo continuous refinement as more seismic stations report.
              Historical updates are immutably logged:
            </p>

            {allRevisions.length ? (
              <div className="space-y-2 font-mono text-xs">
                {allRevisions.map((rev) => (
                  <div
                    key={rev.revisionId}
                    className="p-3 rounded-lg bg-card border border-border flex items-start gap-3"
                  >
                    <GitCommit className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground">
                          {AGENCY_METADATA[rev.agency].flag} {rev.agency}: M{rev.magnitude}{" "}
                          {rev.magnitudeType} ({rev.status})
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatUtc(new Date(rev.timestamp).getTime())}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{rev.changeSummary}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Coords: {rev.latitude.toFixed(2)}°N, {rev.longitude.toFixed(2)}°E · Depth:{" "}
                        {rev.depthKm ? `${rev.depthKm}km` : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic p-3 bg-card rounded border border-border">
                No subsequent revisions received. Current parameters represent the primary published
                solution for each reporting agency.
              </div>
            )}
          </div>

          {/* ── SECTION 4: DATA PROVENANCE & TRANSPARENCY ───────────────── */}
          <div className="bg-surface/30 p-4 rounded-xl border border-border text-xs leading-relaxed space-y-2">
            <h4 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Data Provenance & Scientific Integrity Policy
            </h4>
            <p className="text-muted-foreground">
              Every data point surfaced in this platform originates from official seismological feeds:
              NEMRC (Nepal DMG), CEA/CENC (China), and USGS (United States).
            </p>
            <p className="text-muted-foreground">
              Our assessment engine executes automated spatial-temporal clustering and magnitude
              scale comparison without human editorial modification or selective cherry-picking.
              Users should always refer directly to sovereign government agencies for official
              evacuation directives and civil protection instructions.
            </p>
          </div>
        </div>

        {/* ── MODAL FOOTER ────────────────────────────────────────────── */}
        <div className="bg-surface/90 px-6 py-3 border-t border-border flex items-center justify-between shrink-0 text-xs font-mono">
          <span className="text-muted-foreground">Engine Version: {a.processingVersion}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
