/**
 * seismicStore.server.ts — Multi-Source Ingestion Pipeline & Store
 * =================================================================
 * Thread-safe backend service handling:
 * - Independent asynchronous polling of NEMRC, CENC, and USGS feeds
 * - Rate limiting and caching
 * - Correlation and clustering into MultiSourceEventGroups
 * - Revision history retention (never overwriting historical values)
 * - Real-time diagnostics & health logging
 */

import type {
  DiagnosticsSummary,
  MultiSourceEventGroup,
  RawSourceObservation,
  SourceAgency,
  SourceHealthStatus,
} from "@/data/multiSourceSchema";
import { SEISMIC_CONFIG } from "./config";
import { fetchUsgsObservations } from "./adapters/usgsAdapter";
import { fetchNemrcObservations } from "./adapters/nemrcAdapter";
import { fetchCencObservations } from "./adapters/cencAdapter";
import { clusterObservations } from "./eventMatcher";
import { generateMultiSourceAssessment } from "./assessmentEngine";
import { HISTORICAL_BENCHMARK_GROUPS } from "./historicalBenchmarks";

interface IngestionCache {
  lastFetchedAt: number;
  eventGroups: MultiSourceEventGroup[];
  rawObservations: RawSourceObservation[];
  health: Record<SourceAgency, SourceHealthStatus>;
  errorLog: Array<{
    timestamp: string;
    source: SourceAgency | "SYSTEM";
    message: string;
    details?: string;
  }>;
  matchingDecisionsLog: Array<{
    timestamp: string;
    eventGroupId: string;
    action: "CREATED" | "CORRELATED" | "UPDATED";
    summary: string;
  }>;
}

// In-memory cache holding state across server calls
const store: IngestionCache = {
  lastFetchedAt: 0,
  eventGroups: [...HISTORICAL_BENCHMARK_GROUPS],
  rawObservations: [],
  health: {
    NEMRC: {
      source: "NEMRC",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 0,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://seismonepal.gov.np/",
      latencyMs: 0,
      httpStatus: 200,
    },
    CENC: {
      source: "CENC",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 0,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://news.ceic.ac.cn/",
      latencyMs: 0,
      httpStatus: 200,
    },
    USGS: {
      source: "USGS",
      status: "ONLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 0,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: "https://earthquake.usgs.gov/fdsnws/event/1/query",
      latencyMs: 0,
      httpStatus: 200,
    },
  },
  errorLog: [],
  matchingDecisionsLog: [],
};

const serverStartTime = Date.now();
let isFetchInProgress = false;

/**
 * Executes a full synchronization across all three source agencies.
 */
export async function syncAllSources(forceRefresh = false): Promise<MultiSourceEventGroup[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    store.lastFetchedAt > 0 &&
    now - store.lastFetchedAt < SEISMIC_CONFIG.PIPELINE.CACHE_TTL_MS
  ) {
    return store.eventGroups;
  }

  if (isFetchInProgress) {
    return store.eventGroups;
  }

  isFetchInProgress = true;

  try {
    // Parallel fetch with individual error boundaries
    const [usgsRes, nemrcRes, cencRes] = await Promise.allSettled([
      fetchUsgsObservations(),
      fetchNemrcObservations(),
      fetchCencObservations(),
    ]);

    const incomingObservations: RawSourceObservation[] = [];

    // USGS result handling
    if (usgsRes.status === "fulfilled") {
      store.health.USGS = usgsRes.value.health;
      incomingObservations.push(...usgsRes.value.observations);
    } else {
      store.health.USGS.status = "OFFLINE";
      store.health.USGS.consecutiveErrors++;
      store.health.USGS.lastErrorMessage = String(usgsRes.reason?.message || usgsRes.reason);
      logError("USGS", "USGS adapter fetch failed", String(usgsRes.reason));
    }

    // NEMRC result handling
    if (nemrcRes.status === "fulfilled") {
      store.health.NEMRC = nemrcRes.value.health;
      incomingObservations.push(...nemrcRes.value.observations);
    } else {
      store.health.NEMRC.status = "OFFLINE";
      store.health.NEMRC.consecutiveErrors++;
      store.health.NEMRC.lastErrorMessage = String(nemrcRes.reason?.message || nemrcRes.reason);
      logError("NEMRC", "NEMRC adapter fetch failed", String(nemrcRes.reason));
    }

    // CENC result handling
    if (cencRes.status === "fulfilled") {
      store.health.CENC = cencRes.value.health;
      incomingObservations.push(...cencRes.value.observations);
    } else {
      store.health.CENC.status = "OFFLINE";
      store.health.CENC.consecutiveErrors++;
      store.health.CENC.lastErrorMessage = String(cencRes.reason?.message || cencRes.reason);
      logError("CENC", "CENC adapter fetch failed", String(cencRes.reason));
    }

    // Deduplicate / merge incoming observations into raw observation history
    const obsMap = new Map<string, RawSourceObservation>();
    for (const obs of store.rawObservations) {
      obsMap.set(obs.observationId, obs);
    }
    for (const obs of incomingObservations) {
      const existing = obsMap.get(obs.observationId);
      if (existing) {
        // If parameters changed (e.g. magnitude revision), record revision without destroying history
        if (
          existing.magnitudeValue !== obs.magnitudeValue ||
          existing.depthKm !== obs.depthKm ||
          existing.status !== obs.status
        ) {
          const revId = `rev_${Date.now()}`;
          existing.revisions.push({
            revisionId: revId,
            timestamp: new Date().toISOString(),
            magnitude: existing.magnitudeValue,
            magnitudeType: existing.magnitudeType,
            depthKm: existing.depthKm ?? undefined,
            latitude: existing.latitude,
            longitude: existing.longitude,
            status: existing.status,
            changeSummary: `Updated from M${existing.magnitudeValue} (${existing.status}) to M${obs.magnitudeValue} (${obs.status})`,
          });
          existing.magnitudeValue = obs.magnitudeValue;
          existing.magnitudeType = obs.magnitudeType;
          existing.depthKm = obs.depthKm;
          existing.status = obs.status;
          existing.updatedAt = obs.updatedAt;
        }
      } else {
        obsMap.set(obs.observationId, obs);
      }
    }
    store.rawObservations = Array.from(obsMap.values());

    // Run Event Matching & Correlation Layer
    const clustered = clusterObservations(store.rawObservations);
    const liveGroups = clustered.map((c) => generateMultiSourceAssessment(c));

    // Combine with historical benchmarks (avoiding ID collisions)
    const groupMap = new Map<string, MultiSourceEventGroup>();
    for (const bench of HISTORICAL_BENCHMARK_GROUPS) {
      groupMap.set(bench.eventGroupId, bench);
    }
    for (const group of liveGroups) {
      groupMap.set(group.eventGroupId, group);
    }

    store.eventGroups = Array.from(groupMap.values()).sort(
      (a, b) => b.assessment.consensusOriginTimeMs - a.assessment.consensusOriginTimeMs,
    );

    store.lastFetchedAt = Date.now();

    // Log matching decisions
    for (const g of liveGroups.slice(0, 5)) {
      if (g.assessment.sourceCount > 1) {
        store.matchingDecisionsLog.unshift({
          timestamp: new Date().toISOString(),
          eventGroupId: g.eventGroupId,
          action: "CORRELATED",
          summary: `Correlated ${g.assessment.sourcesReporting.join(" + ")} (M${g.assessment.representativeMagnitude} approx, ${g.assessment.spatialAgreement.averageDistanceKm}km avg spatial distance)`,
        });
      }
    }
    if (store.matchingDecisionsLog.length > 50) {
      store.matchingDecisionsLog = store.matchingDecisionsLog.slice(0, 50);
    }

    return store.eventGroups;
  } finally {
    isFetchInProgress = false;
  }
}

function logError(source: SourceAgency | "SYSTEM", message: string, details?: string) {
  store.errorLog.unshift({
    timestamp: new Date().toISOString(),
    source,
    message,
    details,
  });
  if (store.errorLog.length > 50) {
    store.errorLog = store.errorLog.slice(0, 50);
  }
}

export async function getMultiSourceFeedServer(limit = 30): Promise<{
  groups: MultiSourceEventGroup[];
  health: Record<SourceAgency, SourceHealthStatus>;
  lastUpdated: string;
}> {
  const groups = await syncAllSources();
  return {
    groups: groups.slice(0, limit),
    health: store.health,
    lastUpdated: new Date(store.lastFetchedAt || Date.now()).toISOString(),
  };
}

export function getEventGroupByIdServer(groupId: string): MultiSourceEventGroup | null {
  return store.eventGroups.find((g) => g.eventGroupId === groupId) || null;
}

export function getDiagnosticsServer(): DiagnosticsSummary {
  const availableSourceCount = Object.values(store.health).filter(
    (h) => h.status === "ONLINE" || h.status === "DEGRADED",
  ).length;

  const totalEventGroups = store.eventGroups.length;
  const matchedMultiSourceGroups = store.eventGroups.filter((g) => g.assessment.sourceCount > 1).length;
  const singleSourceGroups = totalEventGroups - matchedMultiSourceGroups;

  return {
    systemTime: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    sources: store.health,
    availableSourceCount,
    totalEventGroups,
    matchedMultiSourceGroups,
    singleSourceGroups,
    errorLog: store.errorLog,
    matchingDecisionsLog: store.matchingDecisionsLog,
  };
}
