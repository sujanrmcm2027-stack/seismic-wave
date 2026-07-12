import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Activity, AlertTriangle, Clock3, ExternalLink, MapPin, Radio } from "lucide-react";

type NepalEarthquake = {
  id: string;
  magnitude: number;
  place: string;
  timeMs: number;
  depth: number;
  latitude: number;
  longitude: number;
  magType: string;
  url: string;
};

const NEPAL_BOUNDS = {
  minLat: 26.3,
  maxLat: 30.5,
  minLng: 80.0,
  maxLng: 88.3,
};

const DEFAULT_CENTER: [number, number] = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;
const REFRESH_INTERVAL_MS = 60_000;
const USGS_URL = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${NEPAL_BOUNDS.minLat}&maxlatitude=${NEPAL_BOUNDS.maxLat}&minlongitude=${NEPAL_BOUNDS.minLng}&maxlongitude=${NEPAL_BOUNDS.maxLng}&orderby=time&limit=20`;
const USGS_REGIONAL_FALLBACK_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=24.5&maxlatitude=31.5&minlongitude=78.0&maxlongitude=90.0&orderby=time&limit=50";

const DefaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 6.0) return "var(--color-destructive)";
  if (magnitude >= 5.0) return "var(--color-chart-5)";
  if (magnitude >= 3.0) return "var(--color-chart-4)";
  return "var(--color-chart-2)";
}

function getStatusInfo(events: NepalEarthquake[]) {
  if (!events.length) {
    return {
      icon: "🟢",
      label: "No significant recent activity",
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  const strongest = Math.max(...events.map((event) => event.magnitude));
  if (strongest >= 5.5) {
    return {
      icon: "🔴",
      label: "Strong earthquake detected",
      className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
    };
  }

  if (strongest >= 3.0) {
    return {
      icon: "🟡",
      label: "Moderate activity",
      className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    icon: "🟢",
    label: "No significant recent activity",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
}

function formatNpt(date: Date | number) {
  return new Intl.DateTimeFormat("en-NP", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeAgo(date: Date | number, now: number) {
  const diffMs = now - new Date(date).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function isWithinNepal(event: NepalEarthquake) {
  return (
    event.latitude >= NEPAL_BOUNDS.minLat &&
    event.latitude <= NEPAL_BOUNDS.maxLat &&
    event.longitude >= NEPAL_BOUNDS.minLng &&
    event.longitude <= NEPAL_BOUNDS.maxLng
  );
}

function MapController({ events }: { events: NepalEarthquake[] }) {
  const map = useMap();

  useEffect(() => {
    if (!events.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(events.map((event) => [event.latitude, event.longitude]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 8 });
  }, [events, map]);

  return null;
}

export function LiveNepalEarthquakes() {
  const [events, setEvents] = useState<NepalEarthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const cachedEventsRef = useRef<NepalEarthquake[]>([]);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async (showLoading = false) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let response = await fetch(USGS_URL, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Unable to load the Nepal earthquake feed.");
      }

      let data = await response.json();
      let features = Array.isArray(data?.features) ? data.features : [];

      if (!features.length) {
        const fallbackResponse = await fetch(USGS_REGIONAL_FALLBACK_URL, { signal: controller.signal });
        if (!fallbackResponse.ok) {
          throw new Error("Unable to load the Nepal earthquake feed.");
        }
        const fallbackData = await fallbackResponse.json();
        features = Array.isArray(fallbackData?.features) ? fallbackData.features : [];
      }

      const fetchedEvents = features
        .map((feature: any) => {
          const properties = feature.properties ?? {};
          const geometry = feature.geometry ?? {};
          const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
          const [longitude, latitude, depth] = coordinates;
          return {
            id: feature.id,
            magnitude: Number(properties.mag ?? 0),
            place: properties.place ?? "Unknown location",
            timeMs: Number(properties.time ?? Date.now()),
            depth: Number(depth ?? 0),
            latitude: Number(latitude ?? 0),
            longitude: Number(longitude ?? 0),
            magType: properties.magType ?? "Unknown",
            url: properties.url ?? "https://earthquake.usgs.gov/",
          };
        })
        .filter((event: NepalEarthquake) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude) && isWithinNepal(event))
        .sort((a: NepalEarthquake, b: NepalEarthquake) => b.timeMs - a.timeMs)
        .slice(0, 20);

      cachedEventsRef.current = fetchedEvents;
      setEvents(fetchedEvents);
      setLastUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      if (cachedEventsRef.current.length) {
        setEvents(cachedEventsRef.current);
        setError("Showing the last successful Nepal update while the live feed refreshes.");
      } else {
        setError("Unable to load the Nepal earthquake feed right now.");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(true);

    const intervalId = window.setInterval(() => {
      void fetchEvents(false);
    }, REFRESH_INTERVAL_MS);

    const tickId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(tickId);
      abortControllerRef.current?.abort();
    };
  }, [fetchEvents]);

  const status = useMemo(() => getStatusInfo(events), [events]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-20" aria-labelledby="live-nepal-earthquakes-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary mb-3">LIVE DATA</div>
          <h2 id="live-nepal-earthquakes-title" className="font-serif text-4xl md:text-5xl font-bold mb-3">Live Nepal Earthquakes</h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Recent earthquakes reported by the USGS for Nepal are filtered to this region and refreshed automatically every minute.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${status.className}`}>
          <span>{status.icon}</span>
          <span>{status.label}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Latest Nepal events</div>
              <div className="text-sm text-muted-foreground mt-1">
                {lastUpdatedAt ? `Last updated ${formatTimeAgo(lastUpdatedAt, now)}` : "Awaiting first update"}
              </div>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              {refreshing ? "Refreshing…" : loading && !events.length ? "Loading…" : "Auto-refreshing every 60s"}
            </div>
          </div>

          {loading && !events.length ? (
            <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Loading the latest Nepal earthquake feed from the USGS…
            </div>
          ) : error && !events.length ? (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {events.map((event) => {
                const magnitudeColor = getMagnitudeColor(event.magnitude);
                return (
                  <article key={event.id} className="rounded-lg border border-border/70 bg-surface/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2.5 py-1 text-sm font-semibold" style={{ color: magnitudeColor, borderColor: `${magnitudeColor}33` }}>
                            M{event.magnitude.toFixed(1)}
                          </span>
                          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{event.magType}</span>
                        </div>
                        <div className="font-semibold text-foreground">{event.place}</div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatNpt(event.timeMs)}</span>
                          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.latitude.toFixed(2)}, {event.longitude.toFixed(2)}</span>
                          <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" />{event.depth.toFixed(0)} km</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{formatTimeAgo(event.timeMs, now)}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        <span>{event.magnitude >= 5.5 ? "Strong event" : event.magnitude >= 3.0 ? "Moderate event" : "Minor event"}</span>
                      </div>
                      <a href={event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                        USGS event
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {error && events.length > 0 ? (
            <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Map view</div>
              <div className="text-sm text-muted-foreground mt-1">Markers are fitted to Nepal and updated with the latest events.</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Nepal bounds
            </div>
          </div>

          <div className="mt-4 h-[380px] overflow-hidden rounded-lg border border-border">
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full" attributionControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapController events={events} />
              {events.map((event) => {
                const magnitudeColor = getMagnitudeColor(event.magnitude);
                return (
                  <CircleMarker
                    key={event.id}
                    center={[event.latitude, event.longitude]}
                    radius={Math.max(5, Math.min(16, 4 + event.magnitude * 1.3))}
                    pathOptions={{
                      color: magnitudeColor,
                      fillColor: magnitudeColor,
                      fillOpacity: 0.35,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <div className="font-semibold text-foreground">{event.place}</div>
                        <div className="text-sm text-muted-foreground">Magnitude {event.magnitude.toFixed(1)} · {event.depth.toFixed(0)} km deep</div>
                        <div className="text-xs text-muted-foreground">{formatNpt(event.timeMs)} · NPT</div>
                        <a href={event.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                          Open USGS report
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div className="mt-3 rounded-md border border-border/70 bg-surface/50 p-3 text-sm text-muted-foreground">
            Click any marker to view the event details, magnitude, depth, and source link.
          </div>
        </div>
      </div>
    </section>
  );
}
