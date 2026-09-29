/**
 * MultiSourceMap.tsx — Interactive Multi-Source Earthquake Map
 * =============================================================
 * Implements Section 10:
 * - Distinct visual markers for NEMRC (🇳🇵 red), CENC (🇨🇳 amber), USGS (🇺🇸 blue)
 * - Multi-source representative centroid marker (⭐ purple)
 * - Pairwise connection lines illustrating spatial dispersion/clustering
 * - Toggle: "Show source locations" ON/OFF
 * - Full interactive popups with agency provenance
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { MultiSourceEventGroup, SourceAgency } from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import { Eye, EyeOff, Layers, Radio, AlertTriangle } from "lucide-react";

interface MultiSourceMapProps {
  groups: MultiSourceEventGroup[];
  selectedGroupId?: string | null;
  onSelectGroup?: (group: MultiSourceEventGroup) => void;
  formatNpt: (d: Date | number) => string;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

function MapBoundsController({
  groups,
  selectedGroupId,
}: {
  groups: MultiSourceEventGroup[];
  selectedGroupId?: string | null;
}) {
  const map = useMap();
  const initialFittedRef = useRef(false);
  const lastSelectedGroupIdRef = useRef<string | null | undefined>(undefined);

  // Explicitly activate all spatial navigation handlers on Leaflet instance
  useEffect(() => {
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.dragging.enable();
    if (map.boxZoom) map.boxZoom.enable();
    if (map.keyboard) map.keyboard.enable();
  }, [map]);

  useEffect(() => {
    if (!groups.length) {
      if (!initialFittedRef.current) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        initialFittedRef.current = true;
      }
      return;
    }

    // When a specific group is clicked or focused, pan/zoom to it
    if (selectedGroupId && selectedGroupId !== lastSelectedGroupIdRef.current) {
      lastSelectedGroupIdRef.current = selectedGroupId;
      const target = groups.find((g) => g.eventGroupId === selectedGroupId);
      if (target) {
        const obs = target.matchedObservations;
        if (obs.length > 1) {
          const bounds = L.latLngBounds(obs.map((o) => [o.latitude, o.longitude]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
          return;
        } else if (obs[0]) {
          map.setView([obs[0].latitude, obs[0].longitude], 9);
          return;
        }
      }
    }

    // Only fit initial bounds once on initial feed load to prevent clobbering user zoom/pan
    if (!initialFittedRef.current) {
      const allCoords = groups.flatMap((g) =>
        g.matchedObservations.map((o) => [o.latitude, o.longitude] as [number, number]),
      );
      if (allCoords.length) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
        initialFittedRef.current = true;
      }
    }
  }, [groups, selectedGroupId, map]);

  return null;
}

export default function MultiSourceMap({
  groups,
  selectedGroupId,
  onSelectGroup,
  formatNpt,
  height = "420px",
}: MultiSourceMapProps) {
  const [showSourceLocations, setShowSourceLocations] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<"all" | SourceAgency>("all");

  const activeGroup = useMemo(() => {
    if (selectedGroupId) {
      return groups.find((g) => g.eventGroupId === selectedGroupId) || groups[0];
    }
    return groups[0];
  }, [groups, selectedGroupId]);

  // Color mappings
  const AGENCY_COLORS: Record<SourceAgency, { border: string; fill: string }> = {
    NEMRC: { border: "#ef4444", fill: "#dc2626" }, // Red
    CENC: { border: "#f59e0b", fill: "#d97706" }, // Amber
    USGS: { border: "#3b82f6", fill: "#2563eb" }, // Blue
  };

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── MAP CONTROLS HEADER ────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-xs font-mono shadow-md">
        <button
          onClick={() => setShowSourceLocations(!showSourceLocations)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showSourceLocations
              ? "bg-primary text-primary-foreground font-semibold"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          {showSourceLocations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          Show Source Locations
        </button>

        <div className="h-4 w-px bg-border/80" />

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">Filter:</span>
          {(["all", "NEMRC", "CENC", "USGS"] as const).map((source) => (
            <button
              key={source}
              onClick={() => setSelectedLayer(source)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                selectedLayer === source
                  ? "bg-surface border border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {source === "all" ? "All" : AGENCY_METADATA[source].flag + " " + source}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP LEGEND (BOTTOM RIGHT) ─────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-card/95 backdrop-blur-md px-3 py-2 rounded-lg border border-border text-[11px] font-mono shadow-md space-y-1">
        <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">
          Source Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600 border border-white shrink-0" />
          <span>🇳🇵 NEMRC (Local)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600 border border-white shrink-0" />
          <span>🇨🇳 CENC (Regional)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shrink-0" />
          <span>🇺🇸 USGS (Global)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-600 border border-white shrink-0" />
          <span>⭐ Multi-Source Centroid</span>
        </div>
      </div>

      {/* ── LEAFLET CONTAINER ────────────────────────────────────────── */}
      <div className="relative" style={{ height }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          dragging={true}
          zoomSnap={0.5}
          zoomDelta={0.5}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapBoundsController groups={groups} selectedGroupId={selectedGroupId} />

          {/* Render Connection Lines for Cross-Source Events */}
          {showSourceLocations &&
            groups.map((group) => {
              const obs = group.matchedObservations;
              if (obs.length < 2) return null;

              // Connect pairwise points
              const lines: Array<[[number, number], [number, number]]> = [];
              for (let i = 0; i < obs.length; i++) {
                for (let j = i + 1; j < obs.length; j++) {
                  lines.push([
                    [obs[i].latitude, obs[i].longitude],
                    [obs[j].latitude, obs[j].longitude],
                  ]);
                }
              }

              return lines.map((line, idx) => (
                <Polyline
                  key={`${group.eventGroupId}_line_${idx}`}
                  positions={line}
                  pathOptions={{
                    color: "#a855f7",
                    weight: 1.5,
                    dashArray: "4, 6",
                    opacity: 0.7,
                  }}
                />
              ));
            })}

          {/* Render Multi-Source Centroids */}
          {groups.map((group) => {
            const a = group.assessment;
            return (
              <CircleMarker
                key={`centroid_${group.eventGroupId}`}
                center={[a.centroidLatitude, a.centroidLongitude]}
                radius={Math.max(6, Math.min(14, a.representativeMagnitude * 1.8))}
                pathOptions={{
                  color: "#9333ea",
                  fillColor: "#a855f7",
                  fillOpacity: 0.45,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onSelectGroup?.(group),
                }}
              >
                <Popup>
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="font-bold text-foreground flex items-center justify-between gap-2">
                      <span>{a.primaryPlaceName}</span>
                      <span className="font-mono text-purple-600 font-bold">
                        ~M{a.representativeMagnitude.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Sources reporting: {a.sourceCount} / 3 ({a.sourcesReporting.join(", ")})
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Agreement: {a.agreementLevel}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatNpt(a.consensusOriginTimeMs)}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Render Individual Source Epicenters */}
          {showSourceLocations &&
            groups.flatMap((group) =>
              group.matchedObservations
                .filter((obs) => selectedLayer === "all" || obs.source === selectedLayer)
                .map((obs) => {
                  const style = AGENCY_COLORS[obs.source];
                  const meta = AGENCY_METADATA[obs.source];

                  return (
                    <CircleMarker
                      key={obs.observationId}
                      center={[obs.latitude, obs.longitude]}
                      radius={Math.max(4, Math.min(12, obs.magnitudeValue * 1.5))}
                      pathOptions={{
                        color: style.border,
                        fillColor: style.fill,
                        fillOpacity: 0.7,
                        weight: 2,
                      }}
                      eventHandlers={{
                        click: () => onSelectGroup?.(group),
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 text-xs font-sans">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{meta.flag}</span>
                            <span>{meta.name}</span>
                            <span className="font-mono ml-auto">
                              M{obs.magnitudeValue.toFixed(1)} {obs.magnitudeType}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{obs.placeName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Depth: {obs.depthKm !== null ? `${obs.depthKm}km` : "N/A"} · ID:{" "}
                            {obs.sourceEventId}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {formatNpt(obs.originTimeMs)}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }),
            )}
        </MapContainer>

        {/* Floating Interactivity Helper Hint */}
        <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-2 rounded-md bg-card/90 backdrop-blur-md border border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground shadow-sm pointer-events-none">
          <span>Pan: Drag</span>
          <span>•</span>
          <span>Zoom: Scroll / Double Click</span>
          <span>•</span>
          <span>Snap: 0.5x</span>
        </div>
      </div>

      {/* ── OFFICIAL BOUNDARY DISCLAIMER DIRECTLY BENEATH MAP VIEWPORT ── */}
      <div className="flex items-start gap-3 border-t border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800 dark:text-amber-300">
        <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden>
          <AlertTriangle className="h-4 w-4" />
        </span>
        <p className="text-xs leading-relaxed">
          <span className="font-semibold uppercase tracking-wide">Official Map & Boundary Disclaimer: </span>
          The map boundaries and territorial representations displayed in this cross-verification system are rendered from OpenStreetMap base layers and{" "}
          <span className="font-semibold">may not reflect the official political and administrative map of Nepal as recognized by the Government of Nepal (Survey Department, Ministry of Land Management, Cooperatives and Poverty Alleviation)</span>.
          This portal does not endorse or adjudicate international border representations. For the authentic, legally recognized map of Nepal, refer directly to the{" "}
          <a
            href="https://survey.gov.np"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline hover:text-foreground transition-colors font-mono"
          >
            Survey Department of Nepal (survey.gov.np)
          </a>.
        </p>
      </div>
    </div>
  );
}
