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

export interface DistrictLocation {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export const NEPAL_DISTRICTS: DistrictLocation[] = [
  // Sudurpashchim Province
  { name: "Achham", province: "Sudurpashchim", lat: 29.11, lng: 81.28 },
  { name: "Baitadi", province: "Sudurpashchim", lat: 29.52, lng: 80.55 },
  { name: "Bajhang", province: "Sudurpashchim", lat: 29.65, lng: 81.21 },
  { name: "Bajura", province: "Sudurpashchim", lat: 29.58, lng: 81.56 },
  { name: "Dadeldhura", province: "Sudurpashchim", lat: 29.3, lng: 80.58 },
  { name: "Darchula", province: "Sudurpashchim", lat: 29.85, lng: 80.54 },
  { name: "Doti", province: "Sudurpashchim", lat: 29.26, lng: 80.98 },
  { name: "Kailali", province: "Sudurpashchim", lat: 28.68, lng: 80.57 },
  { name: "Kanchanpur", province: "Sudurpashchim", lat: 28.91, lng: 80.33 },

  // Karnali Province
  { name: "Dailekh", province: "Karnali", lat: 28.84, lng: 81.71 },
  { name: "Dolpa", province: "Karnali", lat: 29.02, lng: 82.88 },
  { name: "Humla", province: "Karnali", lat: 29.97, lng: 81.82 },
  { name: "Jajarkot", province: "Karnali", lat: 28.84, lng: 82.2 },
  { name: "Jumla", province: "Karnali", lat: 29.27, lng: 82.18 },
  { name: "Kalikot", province: "Karnali", lat: 29.23, lng: 81.82 },
  { name: "Mugu", province: "Karnali", lat: 29.62, lng: 82.17 },
  { name: "Rukum West", province: "Karnali", lat: 28.63, lng: 82.47 },
  { name: "Salyan", province: "Karnali", lat: 28.37, lng: 82.16 },
  { name: "Surkhet", province: "Karnali", lat: 28.6, lng: 81.63 },

  // Lumbini Province
  { name: "Arghakhanchi", province: "Lumbini", lat: 27.93, lng: 83.08 },
  { name: "Banke", province: "Lumbini", lat: 28.16, lng: 81.69 },
  { name: "Bardiya", province: "Lumbini", lat: 28.35, lng: 81.35 },
  { name: "Dang", province: "Lumbini", lat: 28.05, lng: 82.35 },
  { name: "Gulmi", province: "Lumbini", lat: 28.07, lng: 83.25 },
  { name: "Kapilvastu", province: "Lumbini", lat: 27.55, lng: 82.97 },
  { name: "Parasi", province: "Lumbini", lat: 27.54, lng: 83.67 },
  { name: "Palpa", province: "Lumbini", lat: 27.87, lng: 83.55 },
  { name: "Pyuthan", province: "Lumbini", lat: 28.1, lng: 82.87 },
  { name: "Rolpa", province: "Lumbini", lat: 28.3, lng: 82.63 },
  { name: "Rukum East", province: "Lumbini", lat: 28.62, lng: 82.78 },
  { name: "Rupandehi", province: "Lumbini", lat: 27.5, lng: 83.45 },

  // Gandaki Province
  { name: "Baglung", province: "Gandaki", lat: 28.27, lng: 83.59 },
  { name: "Gorkha", province: "Gandaki", lat: 28.29, lng: 84.69 },
  { name: "Kaski", province: "Gandaki", lat: 28.35, lng: 83.98 },
  { name: "Lamjung", province: "Gandaki", lat: 28.23, lng: 84.41 },
  { name: "Manang", province: "Gandaki", lat: 28.67, lng: 84.02 },
  { name: "Mustang", province: "Gandaki", lat: 28.99, lng: 83.87 },
  { name: "Myagdi", province: "Gandaki", lat: 28.35, lng: 83.56 },
  { name: "Nawalpur", province: "Gandaki", lat: 27.68, lng: 84.18 },
  { name: "Parbat", province: "Gandaki", lat: 28.23, lng: 83.67 },
  { name: "Syangja", province: "Gandaki", lat: 28.1, lng: 83.87 },
  { name: "Tanahun", province: "Gandaki", lat: 27.93, lng: 84.28 },

  // Bagmati Province
  { name: "Bhaktapur", province: "Bagmati", lat: 27.67, lng: 85.43 },
  { name: "Chitwan", province: "Bagmati", lat: 27.53, lng: 84.45 },
  { name: "Dhading", province: "Bagmati", lat: 27.98, lng: 84.92 },
  { name: "Dolakha", province: "Bagmati", lat: 27.75, lng: 86.17 },
  { name: "Kathmandu", province: "Bagmati", lat: 27.71, lng: 85.32 },
  { name: "Kavrepalanchok", province: "Bagmati", lat: 27.52, lng: 85.55 },
  { name: "Lalitpur", province: "Bagmati", lat: 27.67, lng: 85.32 },
  { name: "Makwanpur", province: "Bagmati", lat: 27.43, lng: 85.03 },
  { name: "Nuwakot", province: "Bagmati", lat: 27.92, lng: 85.17 },
  { name: "Ramechhap", province: "Bagmati", lat: 27.33, lng: 86.08 },
  { name: "Rasuwa", province: "Bagmati", lat: 28.14, lng: 85.29 },
  { name: "Sindhuli", province: "Bagmati", lat: 27.26, lng: 85.97 },
  { name: "Sindhupalchok", province: "Bagmati", lat: 27.95, lng: 85.68 },

  // Madhesh Province
  { name: "Bara", province: "Madhesh", lat: 27.02, lng: 85.0 },
  { name: "Dhanusha", province: "Madhesh", lat: 26.75, lng: 85.95 },
  { name: "Mahottari", province: "Madhesh", lat: 26.83, lng: 85.8 },
  { name: "Parsa", province: "Madhesh", lat: 27.13, lng: 84.85 },
  { name: "Rautahat", province: "Madhesh", lat: 27.0, lng: 85.33 },
  { name: "Saptari", province: "Madhesh", lat: 26.62, lng: 86.75 },
  { name: "Sarlahi", province: "Madhesh", lat: 26.97, lng: 85.56 },
  { name: "Siraha", province: "Madhesh", lat: 26.65, lng: 86.21 },

  // Koshi Province
  { name: "Bhojpur", province: "Koshi", lat: 27.17, lng: 87.05 },
  { name: "Dhankuta", province: "Koshi", lat: 26.98, lng: 87.33 },
  { name: "Ilam", province: "Koshi", lat: 26.91, lng: 87.93 },
  { name: "Jhapa", province: "Koshi", lat: 26.63, lng: 88.0 },
  { name: "Khotang", province: "Koshi", lat: 27.2, lng: 86.77 },
  { name: "Morang", province: "Koshi", lat: 26.65, lng: 87.45 },
  { name: "Okhaldhunga", province: "Koshi", lat: 27.31, lng: 86.5 },
  { name: "Panchthar", province: "Koshi", lat: 27.2, lng: 87.83 },
  { name: "Sankhuwasabha", province: "Koshi", lat: 27.58, lng: 87.21 },
  { name: "Solukhumbu", province: "Koshi", lat: 27.72, lng: 86.72 },
  { name: "Sunsari", province: "Koshi", lat: 26.63, lng: 87.17 },
  { name: "Taplejung", province: "Koshi", lat: 27.35, lng: 87.67 },
  { name: "Terhathum", province: "Koshi", lat: 27.13, lng: 87.53 },
  { name: "Udayapur", province: "Koshi", lat: 26.9, lng: 86.52 },
];

/**
 * Finds the nearest Nepal district to given coordinates.
 */
export function getNearestNepalDistrict(
  lat: number,
  lng: number,
): { district: DistrictLocation; distanceKm: number } {
  let closest = NEPAL_DISTRICTS[0];
  let minDistance = calculateHaversineDistanceKm(lat, lng, closest.lat, closest.lng);

  for (let i = 1; i < NEPAL_DISTRICTS.length; i++) {
    const d = calculateHaversineDistanceKm(lat, lng, NEPAL_DISTRICTS[i].lat, NEPAL_DISTRICTS[i].lng);
    if (d < minDistance) {
      minDistance = d;
      closest = NEPAL_DISTRICTS[i];
    }
  }

  return { district: closest, distanceKm: minDistance };
}

/**
 * Resolves a friendly, highly informative location name given reported text and coordinates.
 * Handles generic "Nepal, Nepal" or unlocalized coordinates by identifying the nearest district.
 */
export function resolveNamedLocation(
  reportedPlaceName?: string | null,
  lat?: number | null,
  lng?: number | null,
): string {
  const cleanPlace = reportedPlaceName?.trim();
  const isGeneric =
    !cleanPlace ||
    cleanPlace.toLowerCase() === "nepal" ||
    cleanPlace.toLowerCase() === "nepal, nepal" ||
    cleanPlace.toLowerCase() === "nepal / himalayan region";

  // If we have coordinates, check district proximity
  if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
    const { district, distanceKm } = getNearestNepalDistrict(lat, lng);

    if (isGeneric) {
      if (distanceKm <= 55) {
        return `${district.name} District, ${district.province}`;
      } else if (distanceKm <= 120) {
        return `Near ${district.name} (${Math.round(distanceKm)} km), ${district.province}`;
      }
      return isWithinNepalBounds(lat, lng)
        ? `${district.name} Region, Nepal`
        : `Himalayan Frontier (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
    }

    // Clean any accidental duplicate ", Nepal, Nepal" suffixes
    if (cleanPlace && /,\s*Nepal,\s*Nepal$/i.test(cleanPlace)) {
      return cleanPlace.replace(/,\s*Nepal,\s*Nepal$/i, ", Nepal");
    }

    return cleanPlace || `${district.name} District, ${district.province}`;
  }

  return cleanPlace || "Nepal / Himalayan Region";
}

/**
 * Calculates empirical perceptible shaking radius (MMI II-III+) in km for shallow crustal quakes.
 */
export function getFeltRadiusKm(magnitude: number): number {
  if (magnitude < 3.5) return 25;
  if (magnitude < 4.0) return 50;
  if (magnitude < 4.5) return 90;
  if (magnitude < 5.0) return 150;
  if (magnitude < 5.5) return 230;
  if (magnitude < 6.0) return 330;
  if (magnitude < 6.5) return 480;
  if (magnitude < 7.0) return 650;
  return 900;
}

export interface FeltInNepalResult {
  felt: boolean;
  isInside: boolean;
  distanceToBorderKm: number;
  feltRadiusKm: number;
  reason: string;
}

/**
 * Determines whether an earthquake was felt within Nepal:
 * 1. Inside Nepal sovereign boundaries (always true)
 * 2. Monitored by NEMRC (Nepal national monitoring network)
 * 3. Or regional epicenter outside Nepal whose felt shaking radius reaches Nepal
 */
export function isFeltInNepal(
  lat: number,
  lng: number,
  magnitude: number,
  hasNemrcReport = false,
): FeltInNepalResult {
  const isInside = isWithinNepalBounds(lat, lng);
  const feltRadius = getFeltRadiusKm(magnitude);
  const { distanceKm, district } = getNearestNepalDistrict(lat, lng);

  if (isInside) {
    return {
      felt: true,
      isInside: true,
      distanceToBorderKm: 0,
      feltRadiusKm: feltRadius,
      reason: `Epicenter inside Nepal (${district.name} District)`,
    };
  }

  if (hasNemrcReport) {
    return {
      felt: true,
      isInside: false,
      distanceToBorderKm: distanceKm,
      feltRadiusKm: feltRadius,
      reason: `Recorded by NEMRC national network near ${district.name}`,
    };
  }

  // Regional epicenter outside Nepal: check if felt radius reaches nearest Nepal district
  const reachesNepal = distanceKm <= feltRadius;
  return {
    felt: reachesNepal,
    isInside: false,
    distanceToBorderKm: distanceKm,
    feltRadiusKm: feltRadius,
    reason: reachesNepal
      ? `Regional M${magnitude.toFixed(1)} quake felt in Nepal (~${Math.round(distanceKm)} km from ${district.name}, felt radius ~${feltRadius} km)`
      : `Distant regional quake (~${Math.round(distanceKm)} km from Nepal), unfelt in Nepal`,
  };
}

