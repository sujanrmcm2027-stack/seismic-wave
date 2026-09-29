/**
 * useMultiSourceEarthquakes.ts — React Hook for Multi-Source Earthquake Intelligence
 * ===================================================================================
 * Consumes server functions for multi-source data, provides client-side caching,
 * real-time polling, and backward-compatible mapping for existing UI components.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MultiSourceEventGroup,
  SourceAgency,
  SourceHealthStatus,
} from "@/data/multiSourceSchema";
import { getMultiSourceFeed, refreshMultiSourceFeed } from "@/lib/seismic/serverFns";
import { HISTORICAL_BENCHMARK_GROUPS } from "@/lib/seismic/historicalBenchmarks";
import { archiveSeismicTremor } from "@/services/firebase";

const CLIENT_CACHE_KEY = "multi_source_seismic_cache";

export function useMultiSourceEarthquakes() {
  const [eventGroups, setEventGroups] = useState<MultiSourceEventGroup[]>(() => {
    try {
      const cached = localStorage.getItem(CLIENT_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return HISTORICAL_BENCHMARK_GROUPS;
  });

  const [health, setHealth] = useState<Record<SourceAgency, SourceHealthStatus>>({
    NEMRC: {
      source: "NEMRC",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 10,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://seismonepal.gov.np/",
      latencyMs: 120,
      httpStatus: 200,
    },
    CENC: {
      source: "CENC",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 8,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://news.ceic.ac.cn/",
      latencyMs: 250,
      httpStatus: 200,
    },
    USGS: {
      source: "USGS",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 15,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://earthquake.usgs.gov/fdsnws/event/1/query",
      latencyMs: 180,
      httpStatus: 200,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(new Date());
  const [selectedGroup, setSelectedGroup] = useState<MultiSourceEventGroup | null>(null);
  const [now, setNow] = useState(Date.now());

  const inFlightRef = useRef(false);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (isManualRefresh) setRefreshing(true);

    try {
      const result = isManualRefresh
        ? await refreshMultiSourceFeed()
        : await getMultiSourceFeed();

      if (result && Array.isArray(result.groups) && result.groups.length > 0) {
        setEventGroups(result.groups);
        if (result.health) setHealth(result.health);
        setLastUpdatedAt(new Date(result.lastUpdated || Date.now()));
        setError(null);
        try {
          localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify(result.groups.slice(0, 30)));
        } catch {}

        // Automatically archive every tremor into Firebase Firestore for research study
        try {
          result.groups.forEach((g) => {
            archiveSeismicTremor({
              eventId: g.eventGroupId,
              source: "MULTI_SOURCE",
              originTimeMs: g.representativeOriginTimeMs,
              originTimeNpt: new Date(g.representativeOriginTimeMs).toLocaleString("en-NP", {
                timeZone: "Asia/Kathmandu",
              }),
              magnitude: g.representativeMagnitudeValue,
              magnitudeType: g.representativeMagnitudeType,
              depthKm: g.representativeDepthKm,
              placeName: g.representativePlaceName,
              latitude: g.representativeLatitude,
              longitude: g.representativeLongitude,
              agreementLevel: g.agreementLevel,
              reportingAgencies: g.reportingAgencies,
              sourceUrl: g.matchedObservations[0]?.officialVerificationUrl,
            });
          });
        } catch (e) {
          console.debug("[Archive] Background seismic archiving:", e);
        }
      }
    } catch (err: any) {
      console.warn("Multi-source seismic fetch error:", err);
      setError("Unable to sync live multi-source feeds. Showing local verified data.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
    const interval = setInterval(() => void fetchData(false), 60_000);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, [fetchData]);

  const latestGroup = useMemo(() => eventGroups[0] ?? null, [eventGroups]);

  // Backward-compatible legacy format for existing components
  const legacyEvents = useMemo(() => {
    return eventGroups.map((g) => {
      const a = g.assessment;
      // Primary source observation for link
      const primaryObs = g.observations.NEMRC || g.observations.USGS || g.observations.CENC;
      return {
        id: g.eventGroupId,
        magnitude: a.representativeMagnitude,
        place: a.primaryPlaceName,
        timeMs: a.consensusOriginTimeMs,
        depth: a.representativeDepthKm,
        latitude: a.centroidLatitude,
        longitude: a.centroidLongitude,
        magType: a.magnitudeTypeSummary || "Multi-scale",
        url: primaryObs?.sourceUrl || "https://earthquake.usgs.gov/",
        eventId: g.eventGroupId,
        // Multi-source annotations
        agreementLevel: a.agreementLevel,
        sourceCount: a.sourceCount,
        sourcesReporting: a.sourcesReporting,
        rawGroup: g,
      };
    });
  }, [eventGroups]);

  const availableSourceCount = useMemo(() => {
    return Object.values(health).filter((h) => h.status === "ONLINE" || h.status === "DEGRADED").length;
  }, [health]);

  const formatNpt = useCallback((date: Date | number) => {
    return new Intl.DateTimeFormat("en-NP", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }, []);

  const formatUtc = useCallback((date: Date | number) => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }, []);

  const formatTimeAgo = useCallback((date: Date | number, currentNow: number) => {
    const diffMinutes = Math.max(1, Math.round((currentNow - new Date(date).getTime()) / 60000));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  }, []);

  return {
    eventGroups,
    latestGroup,
    selectedGroup,
    setSelectedGroup,
    health,
    availableSourceCount,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    now,
    legacyEvents,
    refresh: () => fetchData(true),
    formatNpt,
    formatUtc,
    formatTimeAgo,
  };
}
