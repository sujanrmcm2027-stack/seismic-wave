/**
 * eventMatcher.ts — Multi-Criteria Event Correlation & Clustering Layer
 * =======================================================================
 * Correlates disparate event records from NEMRC, CENC, and USGS into
 * cohesive physical earthquake groups (event_group_id) using configurable
 * temporal, spatial, and magnitude criteria.
 */

import type {
  RawSourceObservation,
  SourceAgency,
} from "@/data/multiSourceSchema";
import { SEISMIC_CONFIG } from "./config";
import { calculateHaversineDistanceKm } from "./geoUtils";

export interface EventMatchResult {
  matches: boolean;
  score: number; // 0 to 1 confidence
  distanceKm: number;
  timeDeltaSec: number;
  magDelta: number;
  reasons: string[];
}

/**
 * Evaluates whether two distinct observations likely describe the same physical event.
 */
export function evaluateEventPairMatch(
  obsA: RawSourceObservation,
  obsB: RawSourceObservation,
  config = SEISMIC_CONFIG.MATCHING,
): EventMatchResult {
  // If identical source and event ID, definitely the same (or revision)
  if (obsA.source === obsB.source && obsA.sourceEventId === obsB.sourceEventId) {
    return {
      matches: true,
      score: 1.0,
      distanceKm: 0,
      timeDeltaSec: 0,
      magDelta: 0,
      reasons: ["Same agency and identical event ID"],
    };
  }

  // Must be from different sources to be correlated into a cross-source pair
  if (obsA.source === obsB.source) {
    return {
      matches: false,
      score: 0,
      distanceKm: 9999,
      timeDeltaSec: 9999,
      magDelta: 9999,
      reasons: ["Different events from same reporting agency"],
    };
  }

  const timeDeltaSec = Math.abs(obsA.originTimeMs - obsB.originTimeMs) / 1000;
  const distanceKm = calculateHaversineDistanceKm(
    obsA.latitude,
    obsA.longitude,
    obsB.latitude,
    obsB.longitude,
  );
  const magDelta = Math.abs(obsA.magnitudeValue - obsB.magnitudeValue);

  const reasons: string[] = [];

  // Temporal check
  let timePass = timeDeltaSec <= config.MAX_TIME_DIFF_SEC;
  // Spatial check
  let distPass = distanceKm <= config.MAX_DISTANCE_KM;

  // Tight distance relaxation (e.g. within 25 km, allow slightly wider time window)
  if (distanceKm <= config.TIGHT_DISTANCE_KM && timeDeltaSec <= config.EXTENDED_TIME_DIFF_SEC) {
    timePass = true;
    reasons.push("Tight spatial proximity (<25km) satisfied extended temporal window");
  }

  // Magnitude check (should not be wildly divergent, e.g. M3 vs M7)
  const magPass = magDelta <= config.MAX_MAGNITUDE_DIFF;

  if (timePass && distPass && magPass) {
    reasons.push(
      `Spatial proximity (${distanceKm.toFixed(1)} km <= ${config.MAX_DISTANCE_KM} km)`,
      `Origin time delta (${timeDeltaSec.toFixed(1)}s <= ${config.MAX_TIME_DIFF_SEC}s)`,
      `Magnitude delta (${magDelta.toFixed(1)} <= ${config.MAX_MAGNITUDE_DIFF})`,
    );

    // Confidence score based on proximity
    const spatialScore = Math.max(0, 1 - distanceKm / config.MAX_DISTANCE_KM);
    const timeScore = Math.max(0, 1 - timeDeltaSec / config.MAX_TIME_DIFF_SEC);
    const score = Math.round((spatialScore * 0.55 + timeScore * 0.45) * 100) / 100;

    return {
      matches: true,
      score,
      distanceKm,
      timeDeltaSec,
      magDelta,
      reasons,
    };
  }

  if (!distPass) reasons.push(`Spatial distance too large (${distanceKm.toFixed(1)} km)`);
  if (!timePass) reasons.push(`Origin time delta too large (${timeDeltaSec.toFixed(1)}s)`);
  if (!magPass) reasons.push(`Magnitude divergence too large (${magDelta.toFixed(1)})`);

  return {
    matches: false,
    score: 0,
    distanceKm,
    timeDeltaSec,
    magDelta,
    reasons,
  };
}

export interface ClusteredGroupRaw {
  eventGroupId: string;
  observations: Record<SourceAgency, RawSourceObservation | undefined>;
  matchedObservations: RawSourceObservation[];
  reasons: string[];
}

/**
 * Clusters a pool of observations from all agencies into physical event groups.
 */
export function clusterObservations(
  allObservations: RawSourceObservation[],
  config = SEISMIC_CONFIG.MATCHING,
): ClusteredGroupRaw[] {
  // Sort descending by time so latest events are grouped first
  const pool = [...allObservations].sort((a, b) => b.originTimeMs - a.originTimeMs);
  const groups: ClusteredGroupRaw[] = [];
  const visited = new Set<string>();

  for (const obs of pool) {
    if (visited.has(obs.observationId)) continue;

    // Start a new group seeded with this observation
    const currentGroup: ClusteredGroupRaw = {
      eventGroupId: generateDeterministicGroupId(obs),
      observations: {
        [obs.source]: obs,
      } as any,
      matchedObservations: [obs],
      reasons: [`Seeded by ${obs.source} (${obs.sourceEventId})`],
    };
    visited.add(obs.observationId);

    // Look for matching observations from other agencies
    for (const candidate of pool) {
      if (visited.has(candidate.observationId)) continue;
      if (currentGroup.observations[candidate.source]) continue; // Already have this source in the group

      // Compare candidate against the seed observation
      const matchResult = evaluateEventPairMatch(obs, candidate, config);
      if (matchResult.matches) {
        currentGroup.observations[candidate.source] = candidate;
        currentGroup.matchedObservations.push(candidate);
        visited.add(candidate.observationId);
        currentGroup.reasons.push(
          `Matched ${candidate.source} (${candidate.sourceEventId}) — distance ${matchResult.distanceKm} km, Δt ${matchResult.timeDeltaSec}s`,
        );
      }
    }

    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Creates a stable deterministic event_group_id based on time and location.
 */
function generateDeterministicGroupId(seed: RawSourceObservation): string {
  const d = new Date(seed.originTimeMs);
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = d.toISOString().slice(11, 16).replace(/:/g, "");
  const latStr = Math.round(seed.latitude * 10);
  const lonStr = Math.round(seed.longitude * 10);
  return `eq_${dateStr}_${timeStr}_${latStr}N${lonStr}E`;
}
