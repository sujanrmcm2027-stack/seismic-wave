import { useEffect, useState } from "react";
import {
  SAFE_ZONES_GEOJSON_URL,
  type SafeZone,
  type SafeZoneCollection,
} from "@/data/evacuationZones";

type SafeZonesState = {
  /** Raw FeatureCollection, handed to react-leaflet's <GeoJSON> for map rendering. */
  collection: SafeZoneCollection | null;
  /** Flattened { ...properties, lat, lng } per feature, used for Haversine ranking and the sidebar. */
  zones: SafeZone[];
  loading: boolean;
  error: string | null;
};

/**
 * Fetches the nationwide safe-zone dataset once on mount and normalizes
 * every GeoJSON Point feature (whether one of the 83 named Kathmandu Valley
 * spaces or a rest-of-Nepal district entry) into a flat
 * { lat, lng, ...properties } record, since GeoJSON stores coordinates as
 * [lng, lat] and nested inside `feature.geometry` — inconvenient for the
 * Haversine/sort/filter logic the sidebar and distance ranking need.
 */
export function useSafeZones(): SafeZonesState {
  const [collection, setCollection] = useState<SafeZoneCollection | null>(null);
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(SAFE_ZONES_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        return response.json() as Promise<SafeZoneCollection>;
      })
      .then((data) => {
        if (cancelled) return;

        const flattened = data.features.map((feature) => ({
          ...feature.properties,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        }));

        setCollection(data);
        setZones(flattened);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load the national safe zones dataset.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { collection, zones, loading, error };
}
