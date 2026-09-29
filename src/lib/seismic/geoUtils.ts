/**
 * geoUtils.ts — Geodetic calculations for multi-source seismic correlation
 * ==========================================================================
 * Provides Haversine distance, centroid calculations, and geographic region mapping.
 */

import { SEISMIC_CONFIG } from "./config";

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180.0;
}

/**
 * Calculates geographic centroid of multiple coordinates.
 */
export function calculateCentroid(points: Array<{ lat: number; lng: number }>): {
  lat: number;
  lng: number;
} {
  if (!points.length) {
    return { lat: 28.3949, lng: 84.124 }; // Nepal central reference
  }
  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng };
  }

  let totalX = 0;
  let totalY = 0;
  let totalZ = 0;

  for (const p of points) {
    const rLat = toRadians(p.lat);
    const rLng = toRadians(p.lng);
    totalX += Math.cos(rLat) * Math.cos(rLng);
    totalY += Math.cos(rLat) * Math.sin(rLng);
    totalZ += Math.sin(rLat);
  }

  const n = points.length;
  const avgX = totalX / n;
  const avgY = totalY / n;
  const avgZ = totalZ / n;

  const centralLng = Math.atan2(avgY, avgX);
  const centralHyp = Math.sqrt(avgX * avgX + avgY * avgY);
  const centralLat = Math.atan2(avgZ, centralHyp);

  return {
    lat: Math.round(((centralLat * 180.0) / Math.PI) * 1000) / 1000,
    lng: Math.round(((centralLng * 180.0) / Math.PI) * 1000) / 1000,
  };
}

/**
 * Checks if coordinates are within the Nepal geographic bounding box.
 */
export function isWithinNepalBounds(lat: number, lng: number): boolean {
  const b = SEISMIC_CONFIG.BOUNDS.NEPAL;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

/**
 * Checks if coordinates are within the broader Himalayan region.
 */
export function isWithinHimalayanBounds(lat: number, lng: number): boolean {
  const b = SEISMIC_CONFIG.BOUNDS.HIMALAYAN_REGIONAL;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
