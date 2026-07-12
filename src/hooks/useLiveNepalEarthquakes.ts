import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const NEPAL_BOUNDS = {
  minLat: 26.3,
  maxLat: 30.5,
  minLng: 80.0,
  maxLng: 88.3,
};

const USGS_URL = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}&minlongitude=${NEPAL_BOUNDS.minLng}&maxlongitude=${NEPAL_BOUNDS.maxLng}&orderby=time&limit=20`;

function isWithinNepal(latitude: number, longitude: number) {
  return (
    latitude >= NEPAL_BOUNDS.minLat &&
    latitude <= NEPAL_BOUNDS.maxLat &&
    longitude >= NEPAL_BOUNDS.minLng &&
    longitude <= NEPAL_BOUNDS.maxLng
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

export function useLiveNepalEarthquakes() {
  const [events, setEvents] = useState<NepalEarthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const cacheRef = useRef<NepalEarthquake[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const fetchEvents = useCallback(async (showLoading = false) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (showLoading) setLoading(true);

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(USGS_URL, { signal: controller.signal });
      if (!response.ok) throw new Error("USGS feed is temporarily unavailable.");

      const data = await response.json();
      const parsedEvents = (data.features ?? [])
        .map((feature: any) => {
          const properties = feature.properties ?? {};
          const geometry = feature.geometry ?? {};
          const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
          const [longitude, latitude, depth] = coordinates;
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
        .filter((event) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude) && isWithinNepal(event.latitude, event.longitude))
        .sort((a, b) => b.timeMs - a.timeMs)
        .slice(0, 20);

      cacheRef.current = parsedEvents;
      setEvents(parsedEvents);
      setLastUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      if (cacheRef.current.length) {
        setEvents(cacheRef.current);
        setError("Showing the last successful Nepal update while the feed refreshes.");
      } else {
        setEvents([]);
        setError("Unable to load the realtime Nepal feed right now.");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(true);

    const refreshTimer = window.setInterval(() => {
      void fetchEvents(false);
    }, 60_000);

    const tickTimer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(tickTimer);
      abortRef.current?.abort();
    };
  }, [fetchEvents]);

  const latestEvent = useMemo(() => events[0] ?? null, [events]);

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
      detail: `No earthquake >= 4.5 in the last 24 hours`,
      tone: "emerald",
    };
  }, [latestEvent]);

  return {
    events,
    latestEvent,
    loading,
    error,
    lastUpdatedAt,
    now,
    statusBadge,
    formatNpt,
    formatUtc,
    formatTimeAgo,
  };
}
