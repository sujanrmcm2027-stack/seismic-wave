import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncEarthquakeEvents } from "@/services/dataService";
import type { MultiSourceEventGroup } from "@/data/multiSourceSchema";
import { getMultiSourceFeed } from "@/lib/seismic/serverFns";

// ── Persistence helpers ────────────────────────────────────────────────────
const HISTORY_KEY = "eq_history";
const HISTORY_MAX = 500; // entries kept, oldest dropped when full

function loadHistory(): NepalEarthquake[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as NepalEarthquake[];
  } catch {
    return [];
  }
}

function mergeHistory(existing: NepalEarthquake[], incoming: NepalEarthquake[]): NepalEarthquake[] {
  const byId = new Map<string, NepalEarthquake>();
  for (const eq of existing) byId.set(eq.eventId || eq.id, eq);
  for (const eq of incoming) byId.set(eq.eventId || eq.id, eq);
  return Array.from(byId.values())
    .sort((a, b) => b.timeMs - a.timeMs)
    .slice(0, HISTORY_MAX);
}

function saveHistory(history: NepalEarthquake[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX / 2)));
    } catch { /* give up */ }
  }
}

export type NepalEarthquake = {
  id: string;
  magnitude: number;
  place: string;
  timeMs: number;
  depth: number;
  latitude: number;
  longitude: number;
  magType: string;
  url: string;
  eventId: string;
  // Multi-source intelligence extensions
  multiSourceGroup?: MultiSourceEventGroup;
  sourcesReporting?: string[];
  agreementLevel?: string;
  sourceCount?: number;
};

export type DataSource = "multi-source" | "usgs" | "nemrc" | "cenc" | "cache";

const NEPAL_BOUNDS = {
  minLat: 26.3,
  maxLat: 30.5,
  minLng: 80.0,
  maxLng: 88.3,
};

const USGS_URL = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}&minlongitude=${NEPAL_BOUNDS.minLng}&maxlongitude=${NEPAL_BOUNDS.maxLng}&orderby=time&limit=20`;

// "No major activity" window for the green status indicator
const QUIET_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const QUIET_THRESHOLD = 4.0; // magnitude below which is considered quiet

function formatNpt(date: Date | number) {
  return new Intl.DateTimeFormat("en-NP", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatUtc(date: Date | number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeAgo(date: Date | number, now: number) {
  const diffMinutes = Math.max(1, Math.round((now - new Date(date).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function useLiveNepalEarthquakes() {
  const [events, setEvents] = useState<NepalEarthquake[]>(() => loadHistory().slice(0, 20));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem("eq_last_updated");
    return saved ? new Date(Number(saved)) : null;
  });
  const [dataSource, setDataSource] = useState<DataSource | null>(() => {
    return (localStorage.getItem("eq_data_source") as DataSource | null) ?? "multi-source";
  });
  const [now, setNow] = useState(Date.now());

  const historyRef = useRef<NepalEarthquake[]>(loadHistory());
  const cacheRef = useRef<NepalEarthquake[]>(historyRef.current.slice(0, 20));
  const inFlightRef = useRef(false);

  const fetchEvents = useCallback(async (showLoading = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (showLoading) setLoading(true);

    // ── Primary: Multi-Source Engine ──────────────────────────────────
    try {
      const feedResult = await getMultiSourceFeed();
      if (feedResult && feedResult.groups && feedResult.groups.length > 0) {
        const mapped: NepalEarthquake[] = feedResult.groups.map((group) => {
          const a = group.assessment;
          const primaryObs = group.observations.NEMRC || group.observations.USGS || group.observations.CENC;
          return {
            id: group.eventGroupId,
            magnitude: a.representativeMagnitude,
            place: a.primaryPlaceName,
            timeMs: a.consensusOriginTimeMs,
            depth: a.representativeDepthKm,
            latitude: a.centroidLatitude,
            longitude: a.centroidLongitude,
            magType: a.magnitudeTypeSummary || "ML",
            url: primaryObs?.sourceUrl || "https://earthquake.usgs.gov/",
            eventId: group.eventGroupId,
            multiSourceGroup: group,
            sourcesReporting: a.sourcesReporting,
            agreementLevel: a.agreementLevel,
            sourceCount: a.sourceCount,
          };
        });

        historyRef.current = mergeHistory(historyRef.current, mapped);
        saveHistory(historyRef.current);
        cacheRef.current = mapped;
        const nowTime = new Date();
        setEvents(mapped);
        setLastUpdatedAt(nowTime);
        setDataSource("multi-source");
        localStorage.setItem("eq_last_updated", String(nowTime.getTime()));
        localStorage.setItem("eq_data_source", "multi-source");
        setError(null);
        inFlightRef.current = false;
        setLoading(false);
        void syncEarthquakeEvents(mapped);
        return;
      }
    } catch (multiErr) {
      console.warn("Multi-source feed fetch fell back to USGS direct:", multiErr);
    }

    // ── Direct USGS Fallback ──────────────────────────────────────────
    try {
      const res = await fetch(USGS_URL);
      if (!res.ok) throw new Error("USGS non-OK");
      const data = await res.json();
      const features = data.features ?? [];
      const parsed: NepalEarthquake[] = features.map((f: any) => {
        const p = f.properties ?? {};
        const [lon, lat, depth] = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : [0, 0, 0];
        return {
          id: f.id,
          magnitude: Number(p.mag ?? 0),
          place: p.place ?? "Nepal",
          timeMs: Number(p.time ?? Date.now()),
          depth: Number(depth ?? 10),
          latitude: Number(lat),
          longitude: Number(lon),
          magType: p.magType ?? "mb",
          url: p.url ?? "https://earthquake.usgs.gov/",
          eventId: p.code ?? f.id,
        };
      });

      historyRef.current = mergeHistory(historyRef.current, parsed);
      saveHistory(historyRef.current);
      setEvents(parsed);
      setDataSource("usgs");
      setError(null);
    } catch {
      if (historyRef.current.length) {
        setEvents(historyRef.current.slice(0, 20));
        setDataSource("cache");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(true);
    const refresh = window.setInterval(() => void fetchEvents(false), 60_000);
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
    };
  }, [fetchEvents]);

  const latestEvent = useMemo(() => events[0] ?? null, [events]);

  const isQuiet = useMemo(() => {
    if (loading) return false;
    return !events.some(
      (e) => e.magnitude >= QUIET_THRESHOLD && now - e.timeMs < QUIET_WINDOW_MS,
    );
  }, [events, loading, now]);

  const statusBadge = useMemo(() => {
    if (!latestEvent) {
      return {
        label: "Normal Monitoring",
        detail: "No earthquake >= 4.5 in the last 24 hours",
        tone: "emerald",
      };
    }
    if (latestEvent.magnitude >= 5.5) {
      return {
        label: "Significant Event",
        detail: `Latest earthquake is M${latestEvent.magnitude.toFixed(1)}`,
        tone: "red",
      };
    }
    if (latestEvent.magnitude >= 4.5) {
      return {
        label: "Elevated Activity",
        detail: `Latest earthquake is M${latestEvent.magnitude.toFixed(1)}`,
        tone: "amber",
      };
    }
    return {
      label: "Normal Monitoring",
      detail: "No earthquake >= 4.5 in the last 24 hours",
      tone: "emerald",
    };
  }, [latestEvent]);

  return {
    events,
    latestEvent,
    loading,
    error,
    lastUpdatedAt,
    dataSource,
    now,
    isQuiet,
    statusBadge,
    formatNpt,
    formatUtc,
    formatTimeAgo,
  };
}
