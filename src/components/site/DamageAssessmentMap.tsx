import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import type { DamageIncident, VerificationStatus } from "@/data/damageAssessment2026";
import type { NepalEarthquake } from "@/hooks/useLiveNepalEarthquakes";
const NEPAL_CENTER: [number, number] = [28.3949, 84.124];
const NEPAL_ZOOM = 7;

const PIN_COLORS: Record<VerificationStatus, string> = {
  unverified: "#ef4444", // red pin — unverified / social media report
  media: "#eab308", // yellow pin — verified mainstream media
  official: "#22c55e", // green pin — official government report
};

const pinIconCache = new Map<VerificationStatus, L.DivIcon>();

function getPinIcon(status: VerificationStatus) {
  const cached = pinIconCache.get(status);
  if (cached) return cached;

  const color = PIN_COLORS[status];
  const icon = L.divIcon({
    className: "damage-pin",
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.45))">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
      <circle cx="13" cy="13" r="5.5" fill="white" fill-opacity="0.92"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });

  pinIconCache.set(status, icon);
  return icon;
}

function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 6.0) return "var(--color-destructive, #ef4444)";
  if (magnitude >= 5.0) return "var(--color-chart-5, #f97316)";
  if (magnitude >= 3.0) return "var(--color-chart-4, #eab308)";
  return "var(--color-chart-2, #3b82f6)";
}


function verificationLabel(status: VerificationStatus) {
  if (status === "official") return "Verified Official";
  if (status === "media") return "Media Verified";
  return "Unverified Report";
}

function FitToIncidents({ incidents }: { incidents: DamageIncident[] }) {
  const map = useMap();

  useEffect(() => {
    if (!incidents.length) {
      map.setView(NEPAL_CENTER, NEPAL_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(incidents.map((incident) => [incident.lat, incident.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 9 });
  }, [incidents, map]);

  return null;
}

export function DamageAssessmentMap({ 
  incidents,
  events = [],
}: { 
  incidents: DamageIncident[];
  events?: NepalEarthquake[];
}) {
  const sorted = useMemo(
    () => [...incidents].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    [incidents],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-surface/70 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Damage Map
        </div>
        <div className="text-sm font-semibold text-foreground">
          2026 impact locations across Nepal
        </div>
      </div>

      <div className="relative h-[420px] w-full lg:h-[560px]">
        <MapContainer
          center={NEPAL_CENTER}
          zoom={NEPAL_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
        >
          <FitToIncidents incidents={sorted} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sorted.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={getPinIcon(incident.verification)}
            >
              <Popup>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {verificationLabel(incident.verification)} · {incident.phase}
                  </div>
                  <div className="font-semibold text-foreground">{incident.headline}</div>
                  <p className="text-sm text-muted-foreground">{incident.detail}</p>
                  <div className="text-xs text-muted-foreground">
                    {incident.place} · {incident.source}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(incident.time).toLocaleString("en-NP", {
                      timeZone: "Asia/Kathmandu",
                    })}{" "}
                    NPT
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          {events.map((event) => {
            const color = getMagnitudeColor(event.magnitude);
            return (
              <CircleMarker
                key={event.id}
                center={[event.latitude, event.longitude]}
                radius={Math.max(5, Math.min(16, 4 + event.magnitude * 1.3))}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.35,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Recent Earthquake
                    </div>
                    <div className="font-semibold text-foreground">{event.place}</div>
                    <p className="text-sm text-muted-foreground">
                      Magnitude {event.magnitude.toFixed(1)} · Depth {event.depth.toFixed(0)} km
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-lg border border-border bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Marker Legend
          </div>
          <ul className="space-y-1.5 text-[11px] font-medium text-foreground">
            <li className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIN_COLORS.unverified }}
              />
              Unverified / Social
            </li>
            <li className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIN_COLORS.media }}
              />
              Media Verified
            </li>
            <li className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIN_COLORS.official }}
              />
              Official Govt
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
