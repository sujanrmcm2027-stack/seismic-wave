export type EvacuationStatus = "Open / Verified" | "Open / Limited Capacity" | "Closed";

export type SafeZoneType = "Open Ground" | "School Ground" | "Stadium" | "Park" | "Institutional Compound";

export type Province =
  | "Koshi"
  | "Madhesh"
  | "Bagmati"
  | "Gandaki"
  | "Lumbini"
  | "Karnali"
  | "Sudurpashchim";

export type SafeZoneProperties = {
  id: string;
  name: string;
  province: Province;
  district: string;
  municipality: string;
  type: SafeZoneType;
  /** Usable open-space area, square meters. */
  usable_area_sqm: number;
  /** Rough shelter capacity, derived from a 3 sq.m/person planning figure. */
  capacity_persons: number;
  status: EvacuationStatus;
  contact_authority: string;
  description: string;
};

export type SafeZoneFeature = GeoJSON.Feature<GeoJSON.Point, SafeZoneProperties>;

export type SafeZoneCollection = GeoJSON.FeatureCollection<GeoJSON.Point, SafeZoneProperties>;

// Flattened, lat/lng-normalized shape used for distance ranking and the
// sidebar list — derived from the raw GeoJSON features fetched from
// `/nepal_safe_zones.geojson` (see useSafeZones), which itself uses
// [lng, lat] coordinate order per the GeoJSON spec.
export type SafeZone = SafeZoneProperties & { lat: number; lng: number };

// Nationwide dataset: 83 specifically named Kathmandu Valley open spaces
// (Kathmandu, Lalitpur, Bhaktapur — grouped under Bagmati Province, since
// that's their actual province) plus one representative safe zone per
// remaining district across all 7 provinces (157 features total).
export const SAFE_ZONES_GEOJSON_URL = "/nepal_safe_zones.geojson";
