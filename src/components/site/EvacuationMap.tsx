import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Navigation, Search, ShieldCheck, WifiOff } from "lucide-react";
import type { EvacuationStatus, SafeZoneFeature, SafeZoneProperties } from "@/data/evacuationZones";
import { useSafeZones } from "@/hooks/useSafeZones";
import { useGeolocation, type GeolocationStatus } from "@/hooks/useGeolocation";
import { haversineDistanceKm, formatDistance } from "@/lib/geo/haversine";

// Nationwide view — the dataset covers the 83 named Kathmandu Valley spaces
// plus one representative safe zone per remaining district across Nepal.
const NEPAL_CENTER: [number, number] = [28.3949, 84.124];
const NEPAL_ZOOM = 7;
const NEAREST_LIMIT = 10;
const ALL_PROVINCES = "All";

const STATUS_COLORS: Record<EvacuationStatus, string> = {
  "Open / Verified": "#22c55e",
  "Open / Limited Capacity": "#eab308",
  Closed: "#ef4444",
};

const zoneIconCache = new Map<EvacuationStatus, L.DivIcon>();

function getZoneIcon(status: EvacuationStatus) {
  const cached = zoneIconCache.get(status);
  if (cached) return cached;

  const color = STATUS_COLORS[status];
  const icon = L.divIcon({
    className: "evacuation-zone-pin",
    html: `<svg width="22" height="29" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.45))">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
      <circle cx="13" cy="13" r="5.5" fill="white" fill-opacity="0.92"/>
    </svg>`,
    iconSize: [22, 29],
    iconAnchor: [11, 29],
    popupAnchor: [0, -26],
  });

  zoneIconCache.set(status, icon);
  return icon;
}

let userIcon: L.DivIcon | null = null;
function getUserIcon() {
  if (!userIcon) {
    userIcon = L.divIcon({
      className: "user-location-pin",
      html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.45),0 2px 4px rgba(0,0,0,0.4);"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }
  return userIcon;
}

// A zone matches the sidebar's Province/search controls if the province
// dropdown is unset (or matches exactly) and the free-text search matches
// the district, municipality, or zone name. Shared by the sidebar list and
// the map's L.geoJSON `filter` option so both stay in sync off one function.
function matchesFilter(
  props: SafeZoneProperties,
  province: string,
  search: string,
  statusFilter?: string,
): boolean {
  const query = search.trim().toLowerCase();
  const matchesProvince = province === ALL_PROVINCES || props.province === province;
  const matchesSearch =
    !query ||
    props.district.toLowerCase().includes(query) ||
    props.municipality.toLowerCase().includes(query) ||
    props.name.toLowerCase().includes(query);
  const matchesStatus =
    !statusFilter ||
    statusFilter === "all" ||
    (statusFilter === "open" && props.status === "Open / Verified") ||
    (statusFilter === "limited" && props.status === "Open / Limited Capacity") ||
    (statusFilter === "closed" && props.status === "Closed");
  return matchesProvince && matchesSearch && matchesStatus;
}


function pointToLayer(feature: SafeZoneFeature, latlng: L.LatLng) {
  return L.marker(latlng, { icon: getZoneIcon(feature.properties.status) });
}

// Bound once per feature as L.geoJSON() loops through the FeatureCollection
// (see the <GeoJSON onEachFeature> below) — injects each space's own
// properties (name, type, usable area, capacity, authority) into its popup.
function onEachFeature(feature: SafeZoneFeature, layer: L.Layer) {
  const props = feature.properties;
  layer.bindPopup(`
    <div class="space-y-1.5">
      <div class="font-semibold text-foreground">${props.name}</div>
      <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">${props.status} &middot; ${props.type} &middot; ${props.municipality}, ${props.district} District</div>
      <div class="text-xs text-muted-foreground">Usable area: ${props.usable_area_sqm.toLocaleString()} m&sup2; &middot; Est. capacity: ${props.capacity_persons.toLocaleString()} people</div>
      <div class="text-xs text-muted-foreground">Authority: ${props.contact_authority}</div>
      <p class="text-sm text-muted-foreground">${props.description}</p>
    </div>
  `);
}

// Recenters the map once, the first time a GPS fix arrives, without
// fighting the user's own pan/zoom on every subsequent position update.
function RecenterOnFirstFix({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!position || hasCentered.current) return;
    hasCentered.current = true;
    map.setView([position.lat, position.lng], 12);
  }, [position, map]);

  return null;
}

export function EvacuationMap({ statusFilter = "all" }: { statusFilter?: string }) {
  const { collection, zones, loading, error: loadError, isOfflineFallback } = useSafeZones();
  const { position, status, error: geoError } = useGeolocation();
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState(ALL_PROVINCES);

  // The 7 provinces, in dataset order (Koshi → Sudurpashchim).
  const provinces = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const zone of zones) {
      if (!seen.has(zone.province)) {
        seen.add(zone.province);
        ordered.push(zone.province);
      }
    }
    return ordered;
  }, [zones]);

  const filteredZones = useMemo(
    () => zones.filter((zone) => matchesFilter(zone, province, search, statusFilter)),
    [zones, province, search, statusFilter],
  );


  // Recomputed whenever `position` changes (each fix from useGeolocation's
  // watchPosition callback) or the Province filter narrows the candidate
  // set: the Haversine formula runs against every remaining feature in the
  // nationwide dataset — the 83 named Kathmandu Valley spaces and every
  // other district alike — and the result is re-sorted nearest-first. With
  // no GPS fix yet, zones fall back to alphabetical order instead of an
  // arbitrary "distance."
  const rankedZones = useMemo(() => {
    return filteredZones
      .map((zone) => ({
        ...zone,
        distanceKm: position ? haversineDistanceKm(position, zone) : null,
      }))
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        return a.name.localeCompare(b.name);
      });
  }, [filteredZones, position]);


  return (
    <div className="grid gap-5 lg:grid-cols-[65fr_35fr]">
      <section
        aria-label="Evacuation zone map"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm relative"
      >
        {isOfflineFallback && (
          <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-center bg-amber-500/90 py-1.5 px-4 text-xs font-medium text-amber-950 backdrop-blur-sm">
            <WifiOff className="mr-2 h-3.5 w-3.5" />
            Displaying cached offline safe zones data. Connection to live database failed.
          </div>
        )}
        <div className="h-[420px] w-full lg:h-[560px] relative">
          {loading && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-surface/50 backdrop-blur-sm">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
          )}
          <MapContainer center={NEPAL_CENTER} zoom={NEPAL_ZOOM} scrollWheelZoom className="h-full w-full">
            <RecenterOnFirstFix position={position} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* react-leaflet's <GeoJSON> wraps L.geoJSON() internally, looping
                over every one of the 157 features in the fetched
                FeatureCollection to build a marker via
                pointToLayer/onEachFeature. `key` forces it to rebuild when
                the Province filter or search changes, since L.geoJSON
                doesn't otherwise diff its `data`/`filter` props. */}
            {collection && (
              <GeoJSON
                key={`${province}-${search}-${statusFilter}`}
                data={collection}
                pointToLayer={pointToLayer}
                onEachFeature={onEachFeature}
                filter={(feature) => matchesFilter(feature.properties, province, search, statusFilter)}
              />
            )}


            {position && (
              <Marker position={[position.lat, position.lng]} icon={getUserIcon()}>
                <Popup>
                  <div className="text-sm font-medium text-foreground">Your current location</div>
                  <div className="text-xs text-muted-foreground">
                    Accuracy &plusmn;{Math.round(position.accuracy)} m
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="bg-surface/30 p-4 border-t border-border text-[10.5px] leading-relaxed text-muted-foreground/80">
          <strong>Map Disclaimer:</strong> The map boundaries and territorial representations displayed here are sourced from USGS (United States Geological Survey) and OpenStreetMap data feeds and may not reflect the official map of Nepal as published and recognised by the Government of Nepal (Survey Department, Ministry of Land Management). This portal does not endorse or validate any particular depiction of Nepal's international boundaries. For the official and legally recognised map of Nepal, please refer to the Survey Department of Nepal at <a href="https://survey.gov.np" target="_blank" rel="noreferrer" className="underline hover:text-foreground transition-colors">survey.gov.np</a>.
        </div>
      </section>

      <aside
        aria-label="Nearest evacuation zones"
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3 shrink-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Nearest Safe Zones
            </div>
            <div className="text-sm font-semibold text-foreground">
              {position ? "Sorted by GPS distance" : "Sorted alphabetically"}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
            {loading ? (
              <span className="h-3 w-12 animate-pulse rounded-sm bg-muted" />
            ) : (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {filteredZones.length} zones
              </>
            )}
          </span>
        </div>

        {/* Search + province filter */}
        <div className="px-3 py-3 border-b border-border shrink-0 space-y-2 bg-surface/30">
          <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="District, municipality, or zone name…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value={ALL_PROVINCES}>All Provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p} Province
              </option>
            ))}
          </select>
        </div>

        {/* Geolocation banner */}
        {status !== "success" && (
          <div className="px-3 pt-3 shrink-0">
            <GeolocationBanner status={status} error={geoError} />
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="h-5 w-5 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted/70" />
                  <div className="h-3 w-1/4 rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        )}
        {loadError && (
          <div className="px-3 pt-3 shrink-0">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadError}
            </div>
          </div>
        )}

        {/* Scrollable list — matches map height */}
        {!loading && !loadError && (
          <div className="flex-1 overflow-y-auto max-h-[420px] lg:max-h-[560px]">
            {rankedZones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border m-3 p-4 text-center text-sm text-muted-foreground">
                No safe zones match this filter.
              </div>
            ) : (
              <ol className="divide-y divide-border">
                {rankedZones.map((zone, index) => (
                  <li
                    key={zone.id}
                    className={`px-4 py-3.5 hover:bg-surface/40 transition-colors ${
                      zone.status === "Open / Verified"
                        ? "border-l-2 border-l-emerald-500/50"
                        : zone.status === "Open / Limited Capacity"
                        ? "border-l-2 border-l-amber-500/50"
                        : "border-l-2 border-l-red-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-foreground text-sm truncate">{zone.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {zone.type} &middot; {zone.municipality}, {zone.district}
                        </div>
                        <div
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: STATUS_COLORS[zone.status] }}
                        >
                          <ShieldCheck className="h-3 w-3" /> {zone.status}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                          <Navigation className="h-3 w-3 text-primary" />
                          {zone.distanceKm !== null ? formatDistance(zone.distanceKm) : "—"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          ~{zone.capacity_persons.toLocaleString()} ppl
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{zone.description}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-surface/40 px-4 py-2 text-[10px] font-mono text-muted-foreground text-center">
          Showing {rankedZones.length} of {filteredZones.length} zones
          {province !== ALL_PROVINCES ? ` · ${province} Province` : " · Nationwide"}
        </div>
      </aside>

    </div>
  );
}

function GeolocationBanner({
  status,
  error,
}: {
  status: GeolocationStatus;
  error: string | null;
}) {
  if (status === "success") return null;

  const isWarning = status === "denied" || status === "insecure" || status === "unavailable";

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
        isWarning
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-surface/60 text-muted-foreground"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {status === "locating" && "Locating you…"}
        {status === "idle" && "Waiting for location access…"}
        {isWarning && (error ?? "Unable to access your location.")}
      </span>
    </div>
  );
}
