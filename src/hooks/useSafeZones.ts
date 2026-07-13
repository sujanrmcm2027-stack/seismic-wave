import { useEffect, useState } from "react";
import type { SafeZone, SafeZoneCollection } from "@/data/evacuationZones";
import { fetchSafeZones } from "@/services/dataService";

type SafeZonesState = {
  /** Raw FeatureCollection, handed to react-leaflet's <GeoJSON> for map rendering. */
  collection: SafeZoneCollection | null;
  /** Flattened { ...properties, lat, lng } per feature, used for Haversine ranking and the sidebar. */
  zones: SafeZone[];
  loading: boolean;
  error: string | null;
  isOfflineFallback: boolean;
};

// High-Performance Client Cache:
// Store the full array in local memory outside the hook so it is fetched
// exactly ONCE when the app initializes, regardless of component remounts.
let cachedCollection: SafeZoneCollection | null = null;
let cachedZones: SafeZone[] | null = null;
let fetchPromise: Promise<{ data: SafeZoneCollection; isOfflineFallback: boolean }> | null = null;
let wasOfflineFallback = false;

export function useSafeZones(): SafeZonesState {
  const [state, setState] = useState<SafeZonesState>({
    collection: cachedCollection,
    zones: cachedZones ?? [],
    loading: !cachedCollection,
    error: null,
    isOfflineFallback: wasOfflineFallback,
  });

  useEffect(() => {
    // If already loaded in memory, do not re-fetch.
    if (cachedCollection && cachedZones) {
      return;
    }

    let cancelled = false;

    // Use a shared promise to prevent parallel requests if multiple
    // components mount `useSafeZones` simultaneously.
    if (!fetchPromise) {
      fetchPromise = fetchSafeZones();
    }

    fetchPromise
      .then(({ data, isOfflineFallback }) => {
        if (cancelled) return;

        const flattened = data.features.map((feature) => ({
          ...feature.properties,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
        }));

        cachedCollection = data;
        cachedZones = flattened;
        wasOfflineFallback = isOfflineFallback;

        setState({
          collection: data,
          zones: flattened,
          loading: false,
          error: null,
          isOfflineFallback,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Unable to load the national safe zones dataset.",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
