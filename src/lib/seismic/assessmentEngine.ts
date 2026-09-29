/**
 * assessmentEngine.ts — Transparent Multi-Source Assessment Engine
 * =================================================================
 * Computes cross-source indicators: spatial agreement, temporal agreement,
 * depth agreement, magnitude consistency, and agreement level.
 *
 * Implements strict scientific transparency:
 * - Differentiates data consistency from objective truth
 * - Labels results as "Multi-Source Assessment" (never "True" or "Official")
 * - Explains agency roles (NEMRC local, CENC regional, USGS global)
 */

import type {
  AgreementLevel,
  MultiSourceAssessment,
  MultiSourceEventGroup,
  PairwiseDistance,
  PairwiseTimeDelta,
  RawSourceObservation,
  SourceAgency,
} from "@/data/multiSourceSchema";
import { AGENCY_METADATA } from "@/data/multiSourceSchema";
import { SEISMIC_CONFIG } from "./config";
import { calculateCentroid, calculateHaversineDistanceKm, isWithinNepalBounds } from "./geoUtils";
import { calculateRepresentativeMagnitude, evaluateMagnitudeConsistency } from "./magnitudeUtils";
import type { ClusteredGroupRaw } from "./eventMatcher";

export function generateMultiSourceAssessment(group: ClusteredGroupRaw): MultiSourceEventGroup {
  const observations = group.matchedObservations;
  const sourceCount = observations.length;
  const totalTrackedSources = 3;
  const sourcesReporting = observations.map((o) => o.source);

  // ── Coordinates and Centroid ─────────────────────────────────────────
  const points = observations.map((o) => ({ lat: o.latitude, lng: o.longitude }));
  const centroid = calculateCentroid(points);

  // ── Magnitudes ────────────────────────────────────────────────────────
  const magSummary = calculateRepresentativeMagnitude(observations.map((o) => o.magnitudeValue));
  const magConsistencyResult = evaluateMagnitudeConsistency(
    observations.map((o) => ({
      magnitude: o.magnitudeValue,
      magType: o.magnitudeType,
      source: o.source,
    })),
  );

  // ── Spatial Agreement (Pairwise Distances in km) ──────────────────────
  const pairwiseDistances: PairwiseDistance[] = [];
  for (let i = 0; i < observations.length; i++) {
    for (let j = i + 1; j < observations.length; j++) {
      const d = calculateHaversineDistanceKm(
        observations[i].latitude,
        observations[i].longitude,
        observations[j].latitude,
        observations[j].longitude,
      );
      pairwiseDistances.push({
        from: observations[i].source,
        to: observations[j].source,
        distanceKm: d,
      });
    }
  }

  const maxDistanceKm = pairwiseDistances.length
    ? Math.max(...pairwiseDistances.map((p) => p.distanceKm))
    : 0;
  const avgDistanceKm = pairwiseDistances.length
    ? Math.round((pairwiseDistances.reduce((acc, p) => acc + p.distanceKm, 0) / pairwiseDistances.length) * 10) / 10
    : 0;

  let spatialRating: "HIGH" | "MODERATE" | "LOW" | "N/A" = "N/A";
  if (sourceCount >= 2) {
    if (maxDistanceKm <= SEISMIC_CONFIG.AGREEMENT_THRESHOLDS.HIGH.maxDistanceKm) spatialRating = "HIGH";
    else if (maxDistanceKm <= SEISMIC_CONFIG.AGREEMENT_THRESHOLDS.MODERATE.maxDistanceKm) spatialRating = "MODERATE";
    else spatialRating = "LOW";
  }

  // ── Temporal Agreement (Pairwise Deltas in seconds) ───────────────────
  const pairwiseDeltasSec: PairwiseTimeDelta[] = [];
  for (let i = 0; i < observations.length; i++) {
    for (let j = i + 1; j < observations.length; j++) {
      const delta = Math.round(Math.abs(observations[i].originTimeMs - observations[j].originTimeMs) / 1000);
      pairwiseDeltasSec.push({
        from: observations[i].source,
        to: observations[j].source,
        deltaSec: delta,
      });
    }
  }

  const maxDeltaSec = pairwiseDeltasSec.length
    ? Math.max(...pairwiseDeltasSec.map((p) => p.deltaSec))
    : 0;

  let temporalRating: "HIGH" | "MODERATE" | "LOW" | "N/A" = "N/A";
  if (sourceCount >= 2) {
    if (maxDeltaSec <= SEISMIC_CONFIG.AGREEMENT_THRESHOLDS.HIGH.maxTimeDeltaSec) temporalRating = "HIGH";
    else if (maxDeltaSec <= SEISMIC_CONFIG.AGREEMENT_THRESHOLDS.MODERATE.maxTimeDeltaSec) temporalRating = "MODERATE";
    else temporalRating = "LOW";
  }

  // ── Depth Agreement ───────────────────────────────────────────────────
  const reportedDepths = observations.map((o) => ({
    source: o.source,
    depthKm: o.depthKm,
  }));
  const validDepths = reportedDepths.filter((d) => d.depthKm !== null).map((d) => d.depthKm as number);
  const maxDepthDelta = validDepths.length >= 2 ? Math.max(...validDepths) - Math.min(...validDepths) : 0;

  let depthRating: "HIGH" | "MODERATE" | "LOW" | "N/A" = "N/A";
  if (validDepths.length >= 2) {
    if (maxDepthDelta <= 5) depthRating = "HIGH";
    else if (maxDepthDelta <= 15) depthRating = "MODERATE";
    else depthRating = "LOW";
  }

  const representativeDepth = validDepths.length
    ? Math.round(validDepths.reduce((a, b) => a + b, 0) / validDepths.length)
    : 10;

  // ── Source Agreement Level Classification (Section 7) ────────────────
  let agreementLevel: AgreementLevel = "INSUFFICIENT_DATA";
  let dataConsistencyScore = 30; // Base score for single source

  if (sourceCount >= 2) {
    const isHighSpatial = spatialRating === "HIGH";
    const isHighTemporal = temporalRating === "HIGH";
    const isModSpatial = spatialRating === "MODERATE" || isHighSpatial;
    const isModTemporal = temporalRating === "MODERATE" || isHighTemporal;

    if (isHighSpatial && isHighTemporal && magSummary.spread <= 0.8) {
      agreementLevel = "HIGH";
      dataConsistencyScore = sourceCount === 3 ? 95 : 85;
    } else if (isModSpatial && isModTemporal) {
      agreementLevel = "MODERATE";
      dataConsistencyScore = sourceCount === 3 ? 75 : 65;
    } else {
      agreementLevel = "LOW";
      dataConsistencyScore = 45;
    }
  }

  // ── Primary Place Name ───────────────────────────────────────────────
  // Prioritize local Nepal name from NEMRC if available, then USGS place
  const nemrcObs = group.observations.NEMRC;
  const usgsObs = group.observations.USGS;
  const cencObs = group.observations.CENC;

  let primaryPlace = "Nepal / Himalayan Region";
  if (nemrcObs?.placeName) {
    primaryPlace = nemrcObs.placeName;
  } else if (usgsObs?.placeName) {
    primaryPlace = usgsObs.placeName;
  } else if (cencObs?.placeName) {
    primaryPlace = cencObs.placeName;
  }

  // ── Consensus Origin Time ────────────────────────────────────────────
  // Average or median time
  const times = observations.map((o) => o.originTimeMs);
  const consensusTimeMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const consensusTimeUtc = new Date(consensusTimeMs).toISOString();

  // ── Nepal Context (Section 8) ────────────────────────────────────────
  const isInside = isWithinNepalBounds(centroid.lat, centroid.lng);
  const contextualNote = isInside
    ? "Local and regional observations are particularly relevant for this event because of the earthquake's geographic location inside or adjacent to Nepal."
    : "Event located in the broader Himalayan/Tibetan tectonic collision zone outside sovereign Nepal boundaries.";

  // ── Data Status ──────────────────────────────────────────────────────
  let dataStatus: MultiSourceAssessment["dataStatus"] = "PRELIMINARY";
  if (observations.every((o) => o.status === "REVIEWED")) {
    dataStatus = "REVIEWED";
  } else if (observations.some((o) => o.status === "UPDATED" || o.status === "REVISED")) {
    dataStatus = "REVISED";
  } else if (observations.some((o) => o.status === "LIVE")) {
    dataStatus = "LIVE";
  }

  const assessment: MultiSourceAssessment = {
    assessmentId: `asmt_${group.eventGroupId}`,
    eventGroupId: group.eventGroupId,
    representativeMagnitude: magSummary.representative,
    magnitudeRange: {
      min: magSummary.min,
      max: magSummary.max,
      spread: magSummary.spread,
    },
    magnitudeTypeSummary: Array.from(new Set(observations.map((o) => o.magnitudeType))).join(", "),
    centroidLatitude: centroid.lat,
    centroidLongitude: centroid.lng,
    representativeDepthKm: representativeDepth,
    primaryPlaceName: primaryPlace,
    consensusOriginTimeMs: consensusTimeMs,
    consensusOriginTimeUtc: consensusTimeUtc,
    sourceCount,
    totalTrackedSources,
    sourcesReporting,
    agreementLevel,
    dataConsistencyScore,
    spatialAgreement: {
      rating: spatialRating,
      maxDistanceKm,
      averageDistanceKm: avgDistanceKm,
      pairwiseDistances,
    },
    temporalAgreement: {
      rating: temporalRating,
      maxDeltaSec,
      pairwiseDeltasSec,
    },
    depthAgreement: {
      rating: depthRating,
      maxDeltaKm: maxDepthDelta,
      reportedDepths,
    },
    magnitudeConsistency: {
      rating: !magConsistencyResult.areDirectlyComparable
        ? "DIFFERENT_SCALES"
        : magSummary.spread <= 0.3
          ? "HIGH"
          : magSummary.spread <= 0.8
            ? "MODERATE"
            : "LOW",
      maxDifference: magSummary.spread,
      scalesReported: magConsistencyResult.scalesReported,
      areScalesDirectlyComparable: magConsistencyResult.areDirectlyComparable,
      notes: magConsistencyResult.summaryNotes,
    },
    nepalContext: {
      isInsideNepal: isInside,
      regionName: isInside ? "Nepal Tectonic Arc" : "Regional Himalayan Arc",
      contextualNote,
    },
    dataStatus,
    calculatedAt: new Date().toISOString(),
    processingVersion: "2.1.0-multi-source",
    disclaimer: SEISMIC_CONFIG.EXPLAINERS.STANDARD_DISCLAIMER,
  };

  return {
    eventGroupId: group.eventGroupId,
    assessment,
    observations: group.observations,
    matchedObservations: group.matchedObservations,
    matchMetadata: {
      matchedAt: new Date().toISOString(),
      criteriaApplied: group.reasons,
      maxDistanceKm,
      maxTimeDeltaSec: maxDeltaSec,
    },
  };
}
