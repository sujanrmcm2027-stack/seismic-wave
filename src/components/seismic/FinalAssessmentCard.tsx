/**
 * FinalAssessmentCard.tsx — Prominent Multi-Source Assessment Card
 * =================================================================
 * Implements Section 9 & Section 23 of the Multi-Source Intelligence Specification:
 * 1. WHAT HAPPENED?
 * 2. WHAT DO THE SOURCES SAY?
 * 3. HOW MUCH DO THEY AGREE?
 *
 * Transparently separates derived assessment from official source parameters.
 */

import { useState } from "react";
import type { MultiSourceEventGroup, SourceAgency } from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import { SEISMIC_CONFIG } from "@/lib/seismic/config";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Shield,
  Zap,
} from "lucide-react";

interface FinalAssessmentCardProps {
  group: MultiSourceEventGroup;
  onOpenDetails?: (group: MultiSourceEventGroup) => void;
  formatNpt: (d: Date | number) => string;
  formatUtc: (d: Date | number) => string;
  formatTimeAgo: (d: Date | number, now: number) => string;
  now: number;
}

export function FinalAssessmentCard({
  group,
  onOpenDetails,
  formatNpt,
  formatUtc,
  formatTimeAgo,
  now,
}: FinalAssessmentCardProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const a = group.assessment;

  // Agreement badge styling
  const agreementConfig = {
    HIGH: {
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-500",
      icon: "🟢",
      label: "HIGH SOURCE AGREEMENT",
    },
    MODERATE: {
      color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
      dot: "bg-amber-500",
      icon: "🟡",
      label: "MODERATE SOURCE AGREEMENT",
    },
    LOW: {
      color: "border-orange-500/40 bg-orange-500/10 text-orange-400",
      dot: "bg-orange-500",
      icon: "🟠",
      label: "LOW SOURCE AGREEMENT",
    },
    INSUFFICIENT_DATA: {
      color: "border-slate-500/40 bg-slate-500/10 text-slate-400",
      dot: "bg-slate-400",
      icon: "⚪",
      label: "INSUFFICIENT CROSS-SOURCE DATA",
    },
  }[a.agreementLevel];

  const agencies: SourceAgency[] = ["NEMRC", "CENC", "USGS"];

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden transition-all duration-200">
      {/* ── CARD HEADER ──────────────────────────────────────────────── */}
      <div className="bg-surface/80 px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                Multi-Source Earthquake Intelligence
              </span>
              <span className="text-[10px] rounded bg-surface border border-border px-1.5 py-0.2 font-mono text-muted-foreground">
                {a.dataStatus}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <span>{a.primaryPlaceName}</span>
              {a.nepalContext.isInsideNepal && (
                <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Inside Nepal
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Source Agreement Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium ${agreementConfig.color}`}
        >
          <span className="text-xs">{agreementConfig.icon}</span>
          <span className="tracking-wide">{agreementConfig.label}</span>
        </div>
      </div>

      {/* ── CORE ASSESSMENT BODY ─────────────────────────────────────── */}
      <div className="p-5 grid md:grid-cols-[1.3fr_1.7fr] gap-6 items-start">
        {/* LEFT: Multi-Source Consensus Summary */}
        <div className="flex flex-col gap-4 bg-surface/30 rounded-lg p-4 border border-border/60">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Multi-Source Assessment
              </div>
              <div className="font-serif text-4xl font-bold text-foreground mt-0.5 flex items-baseline gap-2">
                <span>~{a.representativeMagnitude.toFixed(1)}</span>
                <span className="text-xs font-mono font-normal text-muted-foreground">
                  (Spread: {a.magnitudeRange.spread.toFixed(1)} units)
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-muted-foreground uppercase">
                Sources Reporting
              </div>
              <div className="font-mono text-xl font-bold text-primary">
                {a.sourceCount} / {a.totalTrackedSources}
              </div>
            </div>
          </div>

          {/* Agreement Metrics Matrix */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border/60">
            <div className="bg-card/70 p-2 rounded border border-border/40">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Epicenter Consistency
              </span>
              <span
                className={`font-semibold ${
                  a.spatialAgreement.rating === "HIGH"
                    ? "text-emerald-400"
                    : a.spatialAgreement.rating === "MODERATE"
                      ? "text-amber-400"
                      : "text-orange-400"
                }`}
              >
                {a.spatialAgreement.rating}
                {a.spatialAgreement.maxDistanceKm > 0 && ` (${a.spatialAgreement.maxDistanceKm} km)`}
              </span>
            </div>

            <div className="bg-card/70 p-2 rounded border border-border/40">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Origin-Time Consistency
              </span>
              <span
                className={`font-semibold ${
                  a.temporalAgreement.rating === "HIGH"
                    ? "text-emerald-400"
                    : a.temporalAgreement.rating === "MODERATE"
                      ? "text-amber-400"
                      : "text-orange-400"
                }`}
              >
                {a.temporalAgreement.rating}
                {a.temporalAgreement.maxDeltaSec > 0 && ` (Δ ${a.temporalAgreement.maxDeltaSec}s)`}
              </span>
            </div>

            <div className="bg-card/70 p-2 rounded border border-border/40">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Magnitude Consistency
              </span>
              <span
                className={`font-semibold ${
                  a.magnitudeConsistency.rating === "HIGH"
                    ? "text-emerald-400"
                    : a.magnitudeConsistency.rating === "DIFFERENT_SCALES"
                      ? "text-amber-400"
                      : "text-orange-400"
                }`}
              >
                {a.magnitudeConsistency.rating === "DIFFERENT_SCALES"
                  ? "Different Scales"
                  : a.magnitudeConsistency.rating}
              </span>
            </div>

            <div className="bg-card/70 p-2 rounded border border-border/40">
              <span className="text-muted-foreground block text-[10px] uppercase">
                Consensus Depth
              </span>
              <span className="font-semibold text-foreground">
                ~{a.representativeDepthKm} km
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>NPT: {formatNpt(a.consensusOriginTimeMs)}</span>
            </div>
            <div className="text-[10px] pl-5 opacity-75">
              UTC: {formatUtc(a.consensusOriginTimeMs)} · {formatTimeAgo(a.consensusOriginTimeMs, now)}
            </div>
          </div>

          {/* Contextual Role Explanation */}
          <div className="text-[11px] leading-relaxed text-muted-foreground bg-primary/5 p-2.5 rounded border border-primary/20">
            <span className="font-semibold text-foreground">Geographic Context: </span>
            {a.nepalContext.contextualNote}
          </div>
        </div>

        {/* RIGHT: Raw Source Reports by Agency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Source Reports (Unaltered Official Values)
            </div>
            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(group)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
              >
                <Maximize2 className="w-3 h-3" />
                Cross-Verification Table
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {agencies.map((agency) => {
              const meta = AGENCY_METADATA[agency];
              const obs = group.observations[agency];

              if (!obs) {
                return (
                  <div
                    key={agency}
                    className="p-3 rounded-lg border border-border/50 bg-surface/20 flex items-center justify-between text-xs text-muted-foreground opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.flag}</span>
                      <span className="font-semibold">{meta.name}</span>
                      <span className="text-[10px] font-mono">({meta.country})</span>
                    </div>
                    <span className="font-mono text-[11px] italic">Not reporting / unavailable</span>
                  </div>
                );
              }

              return (
                <div
                  key={agency}
                  className="p-3 rounded-lg border border-border bg-surface/60 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{meta.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {meta.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-serif text-lg font-bold text-foreground">
                        {obs.magnitudeValue.toFixed(1)}{" "}
                        <span className="text-xs font-mono font-medium text-primary">
                          {obs.magnitudeType}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-y-1 text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>Depth: {obs.depthKm !== null ? `${obs.depthKm} km` : "N/A"}</span>
                      <span>
                        Coords: {obs.latitude.toFixed(2)}°N, {obs.longitude.toFixed(2)}°E
                      </span>
                      <span>ID: {obs.sourceEventId}</span>
                    </div>
                    <a
                      href={obs.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
                    >
                      View Source
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── EDUCATIONAL EXPLAINER: WHY ARE VALUES DIFFERENT? ─────────── */}
      <div className="border-t border-border bg-surface/30 px-5 py-3">
        <button
          onClick={() => setShowExplainer(!showExplainer)}
          className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Why are the reported values different across agencies?
            </span>
          </div>
          {showExplainer ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showExplainer && (
          <div className="mt-3 text-xs leading-relaxed text-muted-foreground space-y-2 pt-2 border-t border-border/50 animate-fade-in">
            <p>
              Different seismic institutions utilize varying instruments, computational models, and
              physics principles to assess earthquakes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-sans">
              {SEISMIC_CONFIG.EXPLAINERS.WHY_VALUES_DIFFER.map((exp, idx) => (
                <li key={idx}>{exp}</li>
              ))}
            </ul>
            <p className="text-[11px] italic font-mono pt-1 text-primary/80">
              * Local agencies (NEMRC) capture immediate near-fault high-frequency energy, regional
              agencies (CENC) monitor broad crustal surface waves, while global networks (USGS) model
              deep mantle moment tensors.
            </p>
          </div>
        )}
      </div>

      {/* ── MANDATORY TRANSPARENCY DISCLAIMER (Section 9) ────────────── */}
      <div className="bg-surface/90 px-5 py-2.5 border-t border-border text-[10px] font-mono text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          IMPORTANT: The Multi-Source Assessment is derived by this application and does not supersede
          official government agency reports.
        </span>
        {onOpenDetails && (
          <button
            onClick={() => onOpenDetails(group)}
            className="text-primary hover:underline font-semibold shrink-0 ml-3"
          >
            Audit Provenance & Revisions →
          </button>
        )}
      </div>
    </div>
  );
}
