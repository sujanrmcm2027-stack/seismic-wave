/**
 * usgsAdapter.ts — Official USGS Earthquake Hazards Program Adapter
 * ===================================================================
 * Connects to USGS FDSN Web Services GeoJSON API.
 * Preserves original event parameters, magnitude scale, and event identifiers.
 */

import type { RawSourceObservation, SourceHealthStatus } from "@/data/multiSourceSchema";
import { SEISMIC_CONFIG } from "../config";

const USGS_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export interface UsgsFetchResult {
  observations: RawSourceObservation[];
  health: SourceHealthStatus;
}

export async function fetchUsgsObservations(
  options: {
    limit?: number;
    minMagnitude?: number;
    startTime?: string;
  } = {},
): Promise<UsgsFetchResult> {
  const startTime = Date.now();
  const limit = options.limit ?? 25;
  const bounds = SEISMIC_CONFIG.BOUNDS.HIMALAYAN_REGIONAL;

  const url = new URL(USGS_BASE_URL);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("minlatitude", String(bounds.minLat));
  url.searchParams.set("maxlatitude", String(bounds.maxLat));
  url.searchParams.set("minlongitude", String(bounds.minLng));
  url.searchParams.set("maxlongitude", String(bounds.maxLng));
  url.searchParams.set("orderby", "time");
  url.searchParams.set("limit", String(limit));

  if (options.minMagnitude !== undefined) {
    url.searchParams.set("minmagnitude", String(options.minMagnitude));
  }
  if (options.startTime) {
    url.searchParams.set("starttime", options.startTime);
  }

  const endpointUrl = url.toString();
  const retrievedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      SEISMIC_CONFIG.PIPELINE.REQUEST_TIMEOUT_MS,
    );

    const res = await fetch(endpointUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "NepalSeismicPortal/2.0 (Multi-Source Verification)",
      },
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      throw new Error(`USGS HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const features: any[] = data.features ?? [];

    const observations: RawSourceObservation[] = features.map((feature: any) => {
      const p = feature.properties ?? {};
      const g = feature.geometry ?? {};
      const [lon, lat, depth] = Array.isArray(g.coordinates) ? g.coordinates : [0, 0, 0];
      const timeMs = Number(p.time ?? Date.now());
      const originTimeUtc = new Date(timeMs).toISOString();

      const rawStatus = (p.status || "").toLowerCase();
      const status = rawStatus === "reviewed" ? "REVIEWED" : "PRELIMINARY";

      const obsId = `usgs_${feature.id || p.code || timeMs}`;

      return {
        observationId: obsId,
        source: "USGS",
        sourceEventId: String(feature.id || p.code || ""),
        magnitudeValue: Number(p.mag ?? 0),
        magnitudeType: String(p.magType || "mb").toUpperCase(),
        latitude: Number(lat),
        longitude: Number(lon),
        depthKm: depth !== undefined && depth !== null ? Number(depth) : null,
        originTimeUtc,
        originTimeMs: timeMs,
        placeName: String(p.place || "Nepal / Himalayan Region"),
        status,
        retrievedAt,
        publishedAt: p.updated ? new Date(p.updated).toISOString() : null,
        updatedAt: p.updated ? new Date(p.updated).toISOString() : null,
        sourceUrl: String(p.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${feature.id}`),
        rawPayload: {
          id: feature.id,
          type: feature.type,
          properties: p,
          geometry: g,
        },
        revisions: [],
      };
    });

    const health: SourceHealthStatus = {
      source: "USGS",
      status: "ONLINE",
      lastSuccessfulFetch: retrievedAt,
      lastEventReceivedAt: observations[0]?.originTimeUtc ?? null,
      recordsProcessed: observations.length,
      consecutiveErrors: 0,
      lastErrorMessage: null,
      endpointUrl: USGS_BASE_URL,
      latencyMs,
      httpStatus: res.status,
    };

    return { observations, health };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err?.name === "AbortError" ? "Connection timed out" : String(err.message || err);

    const health: SourceHealthStatus = {
      source: "USGS",
      status: "OFFLINE",
      lastSuccessfulFetch: null,
      lastEventReceivedAt: null,
      recordsProcessed: 0,
      consecutiveErrors: 1,
      lastErrorMessage: errorMsg,
      endpointUrl: USGS_BASE_URL,
      latencyMs,
      httpStatus: null,
    };

    return { observations: [], health };
  }
}
