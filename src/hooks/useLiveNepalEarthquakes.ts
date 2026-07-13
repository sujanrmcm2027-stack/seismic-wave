import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncEarthquakeEvents } from "@/services/dataService";


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
  // Existing first so incoming (fresher) overwrites same-id entries
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
    // Storage full — keep newest half
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
};

export type DataSource = "usgs" | "nemrc" | "cache";

const NEPAL_BOUNDS = {
  minLat: 26.3,
  maxLat: 30.5,
  minLng: 80.0,
  maxLng: 88.3,
};

// Primary: USGS global feed filtered to Nepal bounding box
const USGS_URL = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}&minlongitude=${NEPAL_BOUNDS.minLng}&maxlongitude=${NEPAL_BOUNDS.maxLng}&orderby=time&limit=20`;

// Secondary: NEMRC/DMG (National Earthquake Monitoring & Research Centre, Nepal)
// When their public CORS-accessible feed becomes available, replace this URL.
// Architecture is ready — just swap the endpoint and the parser below.
const NEMRC_URL = `https://seismonepal.gov.np/api/earthquakes?format=json&limit=20`;

// Data is considered stale if the USGS fetch succeeded > STALE_MS ago
const STALE_MS = 3 * 60 * 1000; // 3 minutes

// "No major activity" window for the green status indicator
const QUIET_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const QUIET_THRESHOLD = 4.0; // magnitude below which is considered quiet

function isWithinNepal(lat: number, lng: number) {
  return (
    lat >= NEPAL_BOUNDS.minLat &&
    lat <= NEPAL_BOUNDS.maxLat &&
    lng >= NEPAL_BOUNDS.minLng &&
    lng <= NEPAL_BOUNDS.maxLng
  );
}

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

// Parse USGS GeoJSON feature array into our NepalEarthquake shape
function parseUsgsFeatures(features: any[]): NepalEarthquake[] {
  return (features ?? [])
    .map((feature: any) => {
      const properties = feature.properties ?? {};
      const geometry = feature.geometry ?? {};
      const [longitude, latitude, depth] = Array.isArray(geometry.coordinates)
        ? geometry.coordinates
        : [];
      return {
        id: feature.id,
        magnitude: Number(properties.mag ?? 0),
        place: properties.place ?? "Unknown location",
        timeMs: Number(properties.time ?? Date.now()),
        depth: Number(depth ?? 0),
        latitude: Number(latitude ?? 0),
        longitude: Number(longitude ?? 0),
        magType: properties.magType ?? "Unknown",
        url: properties.url ?? "https://earthquake.usgs.gov/",
        eventId: properties.code ?? feature.id ?? "",
      };
    })
    .filter(
      (e) =>
        Number.isFinite(e.latitude) &&
        Number.isFinite(e.longitude) &&
        isWithinNepal(e.latitude, e.longitude),
    )
    .sort((a, b) => b.timeMs - a.timeMs)
    .slice(0, 20);
}

// Parse NEMRC JSON into our shape (update when their API spec is confirmed)
function parseNemrcFeatures(data: any): NepalEarthquake[] {
  const items: any[] = data?.earthquakes ?? data?.features ?? data?.data ?? [];
  return items
    .map((item: any) => ({
      id: String(item.id ?? item.eq_id ?? Math.random()),
      magnitude: Number(item.magnitude ?? item.mag ?? 0),
      place: item.place ?? item.location ?? "Nepal",
      timeMs: item.time_ms ?? (item.origin_time ? new Date(item.origin_time).getTime() : Date.now()),
      depth: Number(item.depth ?? 0),
      latitude: Number(item.latitude ?? item.lat ?? 0),
      longitude: Number(item.longitude ?? item.lon ?? 0),
      magType: item.mag_type ?? "Mw",
      url: item.url ?? "https://seismonepal.gov.np/",
      eventId: String(item.event_id ?? item.id ?? ""),
    }))
    .filter(
      (e) =>
        Number.isFinite(e.latitude) &&
        Number.isFinite(e.longitude) &&
        isWithinNepal(e.latitude, e.longitude),
    )
    .sort((a, b) => b.timeMs - a.timeMs)
    .slice(0, 20);
}

export function useLiveNepalEarthquakes() {
  // Seed state from localStorage so data is visible immediately on load
  const [events, setEvents] = useState<NepalEarthquake[]>(() => loadHistory().slice(0, 20));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem("eq_last_updated");
    return saved ? new Date(Number(saved)) : null;
  });
  const [dataSource, setDataSource] = useState<DataSource | null>(() => {
    return (localStorage.getItem("eq_data_source") as DataSource | null) ?? null;
  });
  const [now, setNow] = useState(Date.now());

  const historyRef = useRef<NepalEarthquake[]>(loadHistory());
  const cacheRef = useRef<NepalEarthquake[]>(historyRef.current.slice(0, 20));
  const lastSuccessRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);


  const fetchEvents = useCallback(async (showLoading = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (showLoading) setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // ── Try USGS first ────────────────────────────────────────────────
    try {
      const res = await fetch(USGS_URL, { signal: controller.signal });
      if (!res.ok) throw new Error("USGS non-OK");
      const data = await res.json();
      const parsed = parseUsgsFeatures(data.features ?? []);
      // Merge into rolling history and persist
      historyRef.current = mergeHistory(historyRef.current, parsed);
      saveHistory(historyRef.current);
      cacheRef.current = parsed;
      lastSuccessRef.current = Date.now();
      const now = new Date();
      setEvents(parsed);
      setLastUpdatedAt(now);
      setDataSource("usgs");
      localStorage.setItem("eq_last_updated", String(now.getTime()));
      localStorage.setItem("eq_data_source", "usgs");
      setError(null);
      inFlightRef.current = false;
      setLoading(false);
      // Cloud sync — fire-and-forget, never blocks the UI
      void syncEarthquakeEvents(parsed);
      return;
    } catch (usgsErr) {
      if (usgsErr instanceof DOMException && usgsErr.name === "AbortError") {
        inFlightRef.current = false;
        setLoading(false);
        return;
      }
      console.warn("USGS feed failed, trying NEMRC fallback:", usgsErr);
    }

    // ── Try NEMRC fallback ────────────────────────────────────────────
    try {
      const res = await fetch(NEMRC_URL, {
        signal: controller.signal,
        mode: "cors",
      });
      if (!res.ok) throw new Error("NEMRC non-OK");
      const data = await res.json();
      const parsed = parseNemrcFeatures(data);
      if (parsed.length > 0) {
        historyRef.current = mergeHistory(historyRef.current, parsed);
        saveHistory(historyRef.current);
        cacheRef.current = parsed;
        lastSuccessRef.current = Date.now();
        const now = new Date();
        setEvents(parsed);
        setLastUpdatedAt(now);
        setDataSource("nemrc");
        localStorage.setItem("eq_last_updated", String(now.getTime()));
        localStorage.setItem("eq_data_source", "nemrc");
        setError("USGS feed unavailable — showing NEMRC data.");
        inFlightRef.current = false;
        setLoading(false);
        return;
      }
    } catch (nemrcErr) {
      if (nemrcErr instanceof DOMException && nemrcErr.name === "AbortError") {
        inFlightRef.current = false;
        setLoading(false);
        return;
      }
      console.warn("NEMRC fallback also failed:", nemrcErr);
    }

    // ── Both failed: serve from history cache if available ─────────────
    if (historyRef.current.length) {
      setEvents(historyRef.current.slice(0, 20));
      setDataSource("cache");
      setError("Both feeds unavailable — showing cached Nepal data.");
    } else if (cacheRef.current.length) {
      setEvents(cacheRef.current);
      setDataSource("cache");
      setError("Both feeds unavailable — showing last cached Nepal data.");
    } else {
      setEvents([]);
      setDataSource(null);
      setError("Unable to load live Nepal seismic data. Check your connection.");
    }

    inFlightRef.current = false;
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchEvents(true);
    const refresh = window.setInterval(() => void fetchEvents(false), 60_000);
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
      abortRef.current?.abort();
    };
  }, [fetchEvents]);

  const latestEvent = useMemo(() => events[0] ?? null, [events]);

  // "Quiet" = no event >= QUIET_THRESHOLD in the last QUIET_WINDOW_MS
  const isQuiet = useMemo(() => {
    if (loading) return false;
    return !events.some(
      (e) =>
        e.magnitude >= QUIET_THRESHOLD &&
        now - e.timeMs < QUIET_WINDOW_MS,
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
