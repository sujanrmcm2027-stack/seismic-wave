/**
 * multiSourceSchema.ts — Multi-Source Nepal Earthquake Intelligence Schema
 * =========================================================================
 * Defines the core two-level data architecture:
 * Level A: RawSourceObservation — Immutable, exact provider reports.
 * Level B: MultiSourceAssessment — Derived consensus and agreement metrics.
 *
 * Implements full provenance, revision tracking, and health diagnostics.
 */

export type SourceAgency = "NEMRC" | "CENC" | "USGS";

export interface AgencyMetadata {
  id: SourceAgency;
  name: string;
  fullName: string;
  country: string;
  flag: string;
  role: string;
  roleDescription: string;
  officialUrl: string;
  color: string;
}

export const AGENCY_METADATA: Record<SourceAgency, AgencyMetadata> = {
  NEMRC: {
    id: "NEMRC",
    name: "NEMRC",
    fullName: "National Earthquake Monitoring & Research Centre, DMG",
    country: "Nepal",
    flag: "🇳🇵",
    role: "National/local Nepal monitoring source",
    roleDescription:
      "Local and regional observations are particularly relevant for this event because of the earthquake's geographic location inside or adjacent to Nepal.",
    officialUrl: "https://seismonepal.gov.np/",
    color: "#dc2626", // Red
  },
  CENC: {
    id: "CENC",
    name: "CEA/CENC",
    fullName: "China Earthquake Networks Center / China Earthquake Administration",
    country: "China",
    flag: "🇨🇳",
    role: "Regional monitoring source",
    roleDescription:
      "Provides regional monitoring perspective with dense instrumentation across the Tibetan Plateau and Himalayan frontier.",
    officialUrl: "https://news.ceic.ac.cn/",
    color: "#d97706", // Amber
  },
  USGS: {
    id: "USGS",
    name: "USGS",
    fullName: "United States Geological Survey",
    country: "United States",
    flag: "🇺🇸",
    role: "Global monitoring/reference source",
    roleDescription:
      "Global reference network providing teleseismic recordings and standardized moment tensors for significant earthquakes worldwide.",
    officialUrl: "https://earthquake.usgs.gov/",
    color: "#2563eb", // Blue
  },
};

export type EventRevisionStatus =
  | "LIVE"
  | "PRELIMINARY"
  | "UPDATED"
  | "REVISED"
  | "REVIEWED";

export interface SourceRevisionRecord {
  revisionId: string;
  timestamp: string;
  magnitude: number;
  magnitudeType: string;
  depthKm?: number;
  latitude: number;
  longitude: number;
  status: EventRevisionStatus;
  changeSummary: string;
}

/**
 * Level A: Raw Source Observation
 * Represents the pristine, unaltered data received from a specific agency.
 * Never overwritten or silently normalized.
 */
export interface RawSourceObservation {
  observationId: string;
  source: SourceAgency;
  sourceEventId: string;
  magnitudeValue: number;
  magnitudeType: string; // e.g., 'ML', 'mb', 'Ms', 'Mw'
  latitude: number;
  longitude: number;
  depthKm: number | null;
  originTimeUtc: string; // ISO 8601
  originTimeMs: number;
  placeName: string;
  status: EventRevisionStatus;
  retrievedAt: string; // ISO 8601
  publishedAt: string | null;
  updatedAt: string | null;
  sourceUrl: string;
  rawPayload: Record<string, any>;
  revisions: SourceRevisionRecord[];
}

export type AgreementLevel =
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "INSUFFICIENT_DATA";

export interface PairwiseDistance {
  from: SourceAgency;
  to: SourceAgency;
  distanceKm: number;
}

export interface PairwiseTimeDelta {
  from: SourceAgency;
  to: SourceAgency;
  deltaSec: number;
}

export interface SpatialAgreementInfo {
  rating: "HIGH" | "MODERATE" | "LOW" | "N/A";
  maxDistanceKm: number;
  averageDistanceKm: number;
  pairwiseDistances: PairwiseDistance[];
}

export interface TemporalAgreementInfo {
  rating: "HIGH" | "MODERATE" | "LOW" | "N/A";
  maxDeltaSec: number;
  pairwiseDeltasSec: PairwiseTimeDelta[];
}

export interface DepthAgreementInfo {
  rating: "HIGH" | "MODERATE" | "LOW" | "N/A";
  maxDeltaKm: number;
  reportedDepths: Array<{ source: SourceAgency; depthKm: number | null }>;
}

export interface MagnitudeConsistencyInfo {
  rating: "HIGH" | "MODERATE" | "LOW" | "DIFFERENT_SCALES";
  maxDifference: number;
  scalesReported: string[];
  areScalesDirectlyComparable: boolean;
  notes: string;
}

/**
 * Level B: Derived Multi-Source Assessment
 * Calculated cross-verification metrics without replacing raw values.
 */
export interface MultiSourceAssessment {
  assessmentId: string;
  eventGroupId: string;
  representativeMagnitude: number;
  magnitudeRange: {
    min: number;
    max: number;
    spread: number;
  };
  magnitudeTypeSummary: string;
  centroidLatitude: number;
  centroidLongitude: number;
  representativeDepthKm: number;
  primaryPlaceName: string;
  consensusOriginTimeMs: number;
  consensusOriginTimeUtc: string;

  // Source Coverage
  sourceCount: number; // 1, 2, or 3
  totalTrackedSources: number; // 3
  sourcesReporting: SourceAgency[];

  // Cross-verification metrics
  agreementLevel: AgreementLevel;
  dataConsistencyScore: number; // 0 - 100 indicator (Data Consistency Indicator, not "accuracy")
  spatialAgreement: SpatialAgreementInfo;
  temporalAgreement: TemporalAgreementInfo;
  depthAgreement: DepthAgreementInfo;
  magnitudeConsistency: MagnitudeConsistencyInfo;

  // Contextual classification
  nepalContext: {
    isInsideNepal: boolean;
    regionName: string;
    contextualNote: string;
  };

  dataStatus: EventRevisionStatus;
  calculatedAt: string;
  processingVersion: string;
  disclaimer: string;
}

/**
 * Multi-Source Event Group
 * Unites raw observations from all providers that match the same physical event.
 */
export interface MultiSourceEventGroup {
  eventGroupId: string;
  assessment: MultiSourceAssessment;
  observations: {
    NEMRC?: RawSourceObservation;
    CENC?: RawSourceObservation;
    USGS?: RawSourceObservation;
  };
  matchedObservations: RawSourceObservation[];
  matchMetadata: {
    matchedAt: string;
    criteriaApplied: string[];
    maxDistanceKm: number;
    maxTimeDeltaSec: number;
  };
}

/**
 * Source Health and Diagnostics Status
 */
export interface SourceHealthStatus {
  source: SourceAgency;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastSuccessfulFetch: string | null;
  lastEventReceivedAt: string | null;
  recordsProcessed: number;
  consecutiveErrors: number;
  lastErrorMessage: string | null;
  endpointUrl: string;
  latencyMs: number;
  httpStatus: number | null;
}

export interface DiagnosticsSummary {
  systemTime: string;
  uptimeSeconds: number;
  sources: Record<SourceAgency, SourceHealthStatus>;
  availableSourceCount: number;
  totalEventGroups: number;
  matchedMultiSourceGroups: number;
  singleSourceGroups: number;
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
