/**
 * MultiSourceFeedList.tsx — Interactive Multi-Source Event Feed & Verification List
 * ==================================================================================
 * Lists recent and historical events with cross-verification indicators,
 * individual agency magnitude tags, and interactive detail selection.
 */

import { useState, useMemo } from "react";
import type { MultiSourceEventGroup, AgreementLevel, SourceAgency } from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

interface MultiSourceFeedListProps {
  groups: MultiSourceEventGroup[];
  selectedGroupId?: string | null;
  onSelectGroup: (group: MultiSourceEventGroup) => void;
  onOpenDetails: (group: MultiSourceEventGroup) => void;
  formatNpt: (d: Date | number) => string;
  formatTimeAgo: (d: Date | number, now: number) => string;
  now: number;
}

export function MultiSourceFeedList({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenDetails,
  formatNpt,
  formatTimeAgo,
  now,
}: MultiSourceFeedListProps) {
  const [agencyFilter, setAgencyFilter] = useState<"all" | SourceAgency>("all");
  const [agreementFilter, setAgreementFilter] = useState<"all" | AgreementLevel>("all");

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (agencyFilter !== "all" && !g.observations[agencyFilter]) return false;
      if (agreementFilter !== "all" && g.assessment.agreementLevel !== agreementFilter) return false;
      return true;
    });
  }, [groups, agencyFilter, agreementFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* ── HEADER & FILTERS ────────────────────────────────────────── */}
      <div className="bg-surface/80 p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <h4 className="font-serif font-bold text-foreground text-sm">
              Cross-Verified Seismic Events ({filteredGroups.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            3-Way Verification Active
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-muted-foreground text-[10px] uppercase mr-1">Agency:</span>
          {(["all", "NEMRC", "CENC", "USGS"] as const).map((source) => (
            <button
              key={source}
              onClick={() => setAgencyFilter(source)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                agencyFilter === source
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {source === "all" ? "All Agencies" : AGENCY_METADATA[source].flag + " " + source}
            </button>
          ))}

          <div className="h-3 w-px bg-border mx-1" />

          <span className="text-muted-foreground text-[10px] uppercase mr-1">Agreement:</span>
          {(["all", "HIGH", "MODERATE", "LOW", "INSUFFICIENT_DATA"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setAgreementFilter(lvl)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                agreementFilter === lvl
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl === "all"
                ? "All"
                : lvl === "HIGH"
                  ? "🟢 High"
                  : lvl === "MODERATE"
                    ? "🟡 Mod"
                    : lvl === "LOW"
                      ? "🟠 Low"
                      : "⚪ Single"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ITEMS ──────────────────────────────────────────────── */}
      <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
        {filteredGroups.length ? (
          filteredGroups.map((group) => {
            const a = group.assessment;
            const isSelected = selectedGroupId === group.eventGroupId;

            const agreementBadge = {
              HIGH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
              MODERATE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
              LOW: "bg-orange-500/10 text-orange-400 border-orange-500/30",
              INSUFFICIENT_DATA: "bg-slate-500/10 text-slate-400 border-slate-500/30",
            }[a.agreementLevel];

            return (
              <div
                key={group.eventGroupId}
                onClick={() => onSelectGroup(group)}
                className={`p-4 transition-all cursor-pointer flex flex-col gap-2.5 ${
                  isSelected ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-surface/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold text-foreground">
                      ~M{a.representativeMagnitude.toFixed(1)}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${agreementBadge}`}
                    >
                      {a.agreementLevel === "HIGH" && "🟢 HIGH"}
                      {a.agreementLevel === "MODERATE" && "🟡 MODERATE"}
                      {a.agreementLevel === "LOW" && "🟠 LOW"}
                      {a.agreementLevel === "INSUFFICIENT_DATA" && "⚪ 1 SOURCE"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({a.sourceCount}/3 Sources)
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(group);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline shrink-0"
                  >
                    Compare <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{a.primaryPlaceName}</span>
                </div>

                {/* Contributing Agencies Pill Strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["NEMRC", "CENC", "USGS"] as const).map((agency) => {
                    const obs = group.observations[agency];
                    const meta = AGENCY_METADATA[agency];
                    if (!obs) return null;

                    return (
                      <span
                        key={agency}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono"
                      >
                        <span>{meta.flag}</span>
                        <span className="font-bold text-foreground">{meta.name}:</span>
                        <span className="text-primary font-semibold">
                          {obs.magnitudeValue.toFixed(1)} {obs.magnitudeType}
                        </span>
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <span>{formatNpt(a.consensusOriginTimeMs)}</span>
                  <span>{formatTimeAgo(a.consensusOriginTimeMs, now)}</span>
                  <span>Depth: ~{a.representativeDepthKm} km</span>
                  <span>
                    Coords: {a.centroidLatitude.toFixed(2)}°N, {a.centroidLongitude.toFixed(2)}°E
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs font-mono text-muted-foreground">
            No events match the selected agency or agreement criteria.
          </div>
        )}
      </div>
    </div>
  );
}
