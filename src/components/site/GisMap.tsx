import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Activity, AlertTriangle, MapPin, Radio, Globe2 } from "lucide-react";
import { useEffect, useState } from "react";

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

type QuakeEvent = {
  id: string;
  place: string;
  lat: number;
  lng: number;
  magnitude: number;
  depth: number;
  time: string;
};

const hazardZones = [
  {
    id: "gorkha",
    name: "Gorkha Seismic Belt",
    lat: 28.1,
    lng: 84.6,
    radius: 18,
    color: "var(--color-destructive)",
    description: "High activity along the Main Himalayan Thrust.",
  },
  {
    id: "kathmandu",
    name: "Kathmandu Valley",
    lat: 27.7,
    lng: 85.3,
    radius: 14,
    color: "var(--color-chart-4)",
    description: "Dense urban exposure and vulnerable building stock.",
  },
  {
    id: "jajarkot",
    name: "Jajarkot–Rukum Corridor",
    lat: 28.7,
    lng: 82.2,
    radius: 11,
    color: "var(--color-chart-2)",
    description: "Recent strong shaking and remote access challenges.",
  },
];

function getEventColor(magnitude: number) {
  if (magnitude >= 6) return "var(--color-destructive)";
  if (magnitude >= 4) return "var(--color-chart-4)";
  return "var(--color-chart-1)";
}

const countryBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Nepal: { minLat: 26.3, maxLat: 30.4, minLng: 80.1, maxLng: 88.2 },
  India: { minLat: 6.8, maxLat: 37.1, minLng: 68.0, maxLng: 97.4 },
  Japan: { minLat: 24.0, maxLat: 46.0, minLng: 122.0, maxLng: 146.0 },
  Indonesia: { minLat: -11.0, maxLat: 6.0, minLng: 95.0, maxLng: 141.0 },
  Turkey: { minLat: 35.8, maxLat: 42.2, minLng: 25.8, maxLng: 45.0 },
  Chile: { minLat: -56.0, maxLat: -17.0, minLng: -75.0, maxLng: -66.0 },
  "United States": { minLat: 24.5, maxLat: 49.4, minLng: -125.0, maxLng: -66.0 },
  Mexico: { minLat: 14.5, maxLat: 32.7, minLng: -118.4, maxLng: -86.7 },
  Pakistan: { minLat: 23.7, maxLat: 37.1, minLng: 60.9, maxLng: 77.8 },
  Iran: { minLat: 24.0, maxLat: 39.7, minLng: 44.0, maxLng: 63.3 },
};

function matchesCountry(quake: QuakeEvent, country: string) {
  if (country === "All") return true;

  const placeText = `${quake.place}`.toLowerCase();
  if (placeText.includes(country.toLowerCase())) return true;

  const bounds = countryBounds[country];
  if (!bounds) return false;

  return (
    quake.lat >= bounds.minLat &&
    quake.lat <= bounds.maxLat &&
    quake.lng >= bounds.minLng &&
    quake.lng <= bounds.maxLng
  );
}

function CountryViewController({ countryFilter }: { countryFilter: string }) {
  const map = useMap();

  useEffect(() => {
    if (countryFilter === "All") {
      map.setView([20, 0], 2);
      return;
    }

    const bounds = countryBounds[countryFilter];
    if (!bounds) return;

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    map.setView([centerLat, centerLng], 5);
  }, [countryFilter, map]);

  return null;
}

export function GisMap() {
  const [quakes, setQuakes] = useState<QuakeEvent[]>([]);
  const [countryFilter, setCountryFilter] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [wavePulse, setWavePulse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredQuakes = countryFilter === "All"
    ? quakes
    : quakes.filter((quake) => matchesCountry(quake, countryFilter));

  useEffect(() => {
    let isMounted = true;

    async function loadQuakes() {
      try {
        const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson");
        if (!response.ok) throw new Error("Feed request failed");
        const data = await response.json();
        if (!isMounted) return;

        const events = (data.features || [])
          .slice(0, 50)
          .map((feature: any) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            return {
              id: feature.id,
              place: props.place || "Unknown location",
              lat: geometry.coordinates[1],
              lng: geometry.coordinates[0],
              magnitude: props.mag || 0,
              depth: geometry.coordinates[2] || 0,
              time: props.time,
            };
          })
          .filter((quake: QuakeEvent) => Number.isFinite(quake.lat) && Number.isFinite(quake.lng));

        setQuakes(events);
        setLoading(false);
      } catch {
        if (isMounted) {
          setError("Unable to load the latest worldwide seismic feed right now.");
          setLoading(false);
        }
      }
    }

    loadQuakes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [countryFilter, quakes]);

  useEffect(() => {
    if (!filteredQuakes.length) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredQuakes.length);
      setWavePulse((prev) => (prev + 1) % 6);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [filteredQuakes.length]);

  const activeEvent = filteredQuakes[activeIndex] || null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-surface/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Worldwide Seismic GIS
          </div>
          <div className="text-sm font-semibold text-foreground">Live earthquake data across the globe with Nepal hazard context</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="All">All countries</option>
              <option value="Nepal">Nepal</option>
              <option value="India">India</option>
              <option value="Japan">Japan</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Turkey">Turkey</option>
              <option value="Chile">Chile</option>
              <option value="United States">United States</option>
              <option value="Mexico">Mexico</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Iran">Iran</option>
            </select>
          </label>
          <div className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {loading ? "Loading global feed" : "Live global feed"}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border bg-surface/60 p-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Active event</div>
          {activeEvent ? (
            <>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-xl font-semibold text-foreground">{activeEvent.place}</div>
                  <div className="text-sm text-muted-foreground">{new Date(activeEvent.time).toLocaleString()}</div>
                </div>
                <div className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
                  M{activeEvent.magnitude.toFixed(1)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-primary" /> Depth {activeEvent.depth.toFixed(0)} km</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {activeEvent.lat.toFixed(1)}, {activeEvent.lng.toFixed(1)}</span>
              </div>
            </>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">{error || "Waiting for worldwide data…"}</div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Latest {countryFilter === "All" ? "global" : countryFilter} events</div>
          <ul className="mt-3 space-y-2">
            {filteredQuakes.slice(0, 5).map((quake) => (
              <li key={quake.id} className="flex items-start gap-2 rounded-md border border-border/70 bg-surface/60 px-2.5 py-2 text-sm text-foreground">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-semibold">M{quake.magnitude.toFixed(1)}</span> · {quake.place}
                </span>
              </li>
            ))}
            {!filteredQuakes.length && !loading && (
              <li className="rounded-md border border-border/70 bg-surface/60 px-2.5 py-2 text-sm text-muted-foreground">{error || `No live data available for ${countryFilter}.`}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="h-[560px] w-full">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
          <CountryViewController countryFilter={countryFilter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hazardZones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="font-semibold text-foreground">{zone.name}</div>
                  <p className="text-sm text-muted-foreground">{zone.description}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {filteredQuakes.map((quake) => {
            const color = getEventColor(quake.magnitude);
            return (
              <CircleMarker
                key={quake.id}
                center={[quake.lat, quake.lng]}
                radius={Math.max(4, Math.min(16, quake.magnitude * 1.3))}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.35,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <div className="font-semibold text-foreground">{quake.place}</div>
                    <p className="text-sm text-muted-foreground">Magnitude {quake.magnitude.toFixed(1)} · {quake.depth.toFixed(0)} km deep</p>
                    <p className="text-xs text-muted-foreground">{new Date(quake.time).toLocaleString()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {activeEvent && (
            <>
              {[0, 1, 2].map((ring) => (
                <CircleMarker
                  key={`${activeEvent.id}-${ring}`}
                  center={[activeEvent.lat, activeEvent.lng]}
                  radius={10 + activeEvent.magnitude * 2.2 + ring * 7 + wavePulse * 0.8}
                  pathOptions={{
                    color: getEventColor(activeEvent.magnitude),
                    fillColor: getEventColor(activeEvent.magnitude),
                    fillOpacity: 0.04 + ring * 0.04,
                    weight: 1.5,
                  }}
                />
              ))}
              <CircleMarker
                center={[activeEvent.lat, activeEvent.lng]}
                radius={10 + activeEvent.magnitude * 2.2}
                pathOptions={{
                  color: getEventColor(activeEvent.magnitude),
                  fillColor: getEventColor(activeEvent.magnitude),
                  fillOpacity: 0.35,
                  weight: 3,
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <div className="font-semibold text-foreground">{activeEvent.place}</div>
                    <p className="text-sm text-muted-foreground">{new Date(activeEvent.time).toLocaleString()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            </>
          )}
        </MapContainer>
      </div>

      <div className="grid gap-3 border-t border-border bg-surface/60 p-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Global hazard belts
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Nepal’s risk zones are included as local context beside worldwide event data.</p>
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" /> Worldwide coverage
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Recent global earthquakes are plotted directly from official USGS public feeds.</p>
        </div>
        <div className="rounded-lg border border-border bg-background/70 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-chart-4" /> Live monitoring
          </div>
          <p className="mt-1 text-sm text-muted-foreground">The active marker and pulse rings track the latest highlighted event as the feed updates.</p>
        </div>
      </div>
    </div>
  );
}
