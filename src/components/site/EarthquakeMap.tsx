import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

const DEFAULT_CENTER: [number, number] = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 6.0) return "var(--color-destructive)";
  if (magnitude >= 5.0) return "var(--color-chart-5)";
  if (magnitude >= 3.0) return "var(--color-chart-4)";
  return "var(--color-chart-2)";
}

export function NepalMapController({ events }: { events: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!events.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(events.map((event) => [event.latitude, event.longitude]));
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
  }, [events, map]);
  return null;
}

export function DYFIHeatmap() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const loadReports = () => {
      const data = JSON.parse(localStorage.getItem("dyfi_reports") || "[]");
      const recent = data.filter((r: any) => Date.now() - r.timestamp < 24 * 60 * 60 * 1000);
      setReports(recent);
    };
    loadReports();
    window.addEventListener("dyfi_updated", loadReports);
    return () => window.removeEventListener("dyfi_updated", loadReports);
  }, []);

  return (
    <>
      {reports.map((r) => {
        let color = "#3b82f6";
        if (r.intensity === "Weak") color = "#22c55e";
        if (r.intensity === "Moderate") color = "#eab308";
        if (r.intensity === "Strong") color = "#ef4444";

        return (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 1 }}
          >
            <Popup>
              <div className="text-sm font-semibold text-foreground">Crowdsourced Report</div>
              <div className="text-xs text-muted-foreground">Intensity: {r.intensity}</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function EarthquakeMap({ events, formatNpt }: { events: any[], formatNpt: any }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <NepalMapController events={events} />
      {events.map((event: any) => {
        const color = getMagnitudeColor(event.magnitude);
        return (
          <CircleMarker
            key={event.id}
            center={[event.latitude, event.longitude]}
            radius={Math.max(4, Math.min(12, 4 + event.magnitude * 1.1))}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-foreground">{event.place}</div>
                <div className="text-muted-foreground">
                  M{event.magnitude.toFixed(1)} · {event.depth.toFixed(0)} km
                </div>
                <div className="text-muted-foreground">
                  {formatNpt(event.timeMs)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      <DYFIHeatmap />
    </MapContainer>
  );
}
