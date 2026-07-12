import { useEffect, useState } from "react";

export type GeolocationStatus =
  | "idle"
  | "locating"
  | "success"
  | "denied"
  | "unavailable"
  | "insecure";

export type UserPosition = { lat: number; lng: number; accuracy: number };

type GeolocationState = {
  position: UserPosition | null;
  status: GeolocationStatus;
  error: string | null;
};

/**
 * Wraps the HTML5 Geolocation API with `watchPosition`, so the returned
 * `position` keeps updating as the device moves (a superset of a single
 * `getCurrentPosition` call, whose first fix is delivered the same way).
 * Every emitted fix is what drives the Haversine recalculation in
 * EvacuationMap: consumers just read the latest `position` and re-derive
 * distances from it, they never need to poll.
 */
export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // The Geolocation API is restricted to secure contexts; on plain HTTP
    // (outside localhost) the browser won't even prompt for permission.
    if (!window.isSecureContext) {
      setStatus("insecure");
      setError("Live location requires a secure (HTTPS) connection.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setStatus("locating");

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("success");
        setError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError(
            "Location permission was denied. Enable it in your browser settings to see live distances.",
          );
        } else {
          setStatus("unavailable");
          setError("Unable to determine your current location right now.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, status, error };
}
