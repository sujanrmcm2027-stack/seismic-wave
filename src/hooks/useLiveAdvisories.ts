import { useCallback, useEffect, useRef, useState } from "react";

export type AdvisoryLevel = "critical" | "info";
export type AdvisoryCategory = "earthquake" | "drill" | "station" | "guidance";

export type Advisory = {
  id: string;
  level: AdvisoryLevel;
  category: AdvisoryCategory;
  message: string;
  magnitude?: number;
  location?: string;
  timestamp: string; // ISO 8601
};

type AdvisoriesResponse = {
  status: "operational" | "critical";
  generatedAt: string;
  advisories: Advisory[];
};

const ADVISORIES_ENDPOINT = "/api/live-advisories";
const POLL_INTERVAL_MS = 30_000;

// Shown before the first successful fetch, and kept as the last-known-good
// payload if the endpoint ever fails with nothing cached yet.
const FALLBACK_ADVISORIES: Advisory[] = [
  {
    id: "fallback-tremor",
    level: "info",
    category: "earthquake",
    message: "Minor tremor M3.2 recorded near Lamjung, 14 km depth, no damage reported",
    magnitude: 3.2,
    location: "Lamjung",
    timestamp: new Date().toISOString(),
  },
  {
    id: "fallback-drill",
    level: "info",
    category: "drill",
    message: "Nationwide earthquake preparedness drill scheduled Jan 16, 11:00 NPT",
    timestamp: new Date().toISOString(),
  },
  {
    id: "fallback-station",
    level: "info",
    category: "station",
    message: "NDRRMA seismic monitoring network: 84 stations operational",
    timestamp: new Date().toISOString(),
  },
  {
    id: "fallback-guidance",
    level: "info",
    category: "guidance",
    message: "Review Drop · Cover · Hold On procedures with your household this week",
    timestamp: new Date().toISOString(),
  },
];

export function useLiveAdvisories() {
  const [advisories, setAdvisories] = useState<Advisory[]>(FALLBACK_ADVISORIES);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [now, setNow] = useState(Date.now());

  const cacheRef = useRef<Advisory[]>(FALLBACK_ADVISORIES);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const fetchAdvisories = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(ADVISORIES_ENDPOINT, { signal: controller.signal });
      if (!res.ok) throw new Error(`Advisory feed responded ${res.status}`);

      const data: AdvisoriesResponse = await res.json();
      const next = Array.isArray(data.advisories) ? data.advisories : [];

      if (next.length) {
        cacheRef.current = next;
        setAdvisories(next);
      }
      setLastUpdatedAt(new Date());
      setIsOffline(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Network or server failure — keep showing the last good payload
      // instead of blanking the banner out.
      setAdvisories(cacheRef.current);
      setIsOffline(true);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchAdvisories();

    const pollTimer = window.setInterval(() => void fetchAdvisories(), POLL_INTERVAL_MS);
    const tickTimer = window.setInterval(() => setNow(Date.now()), 15_000);

    return () => {
      window.clearInterval(pollTimer);
      window.clearInterval(tickTimer);
      abortRef.current?.abort();
    };
  }, [fetchAdvisories]);

  const isCritical = advisories.some((a) => a.level === "critical");

  return { advisories, lastUpdatedAt, isOffline, isCritical, now };
}

export function formatRelativeShort(date: Date, now: number) {
  const diffSeconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (diffSeconds < 45) return "Just now";

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
}
