import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { StatCounter } from "@/components/site/StatCounter";
import { EvacuationMap } from "@/components/site/EvacuationMap";
import {
  LifeBuoy,
  MapPin,
  Navigation,
  ShieldCheck,
  Users,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useSafeZones } from "@/hooks/useSafeZones";

export const Route = createFileRoute("/safe-zones")({
  head: () => ({
    meta: [
      { title: "Safe Evacuation Zones: Nepal Seismic" },
      {
        name: "description",
        content:
          "Find the nearest safe evacuation space anywhere in Nepal during or after an earthquake — all 83 named Kathmandu Valley open spaces plus province-wise coverage nationwide, with live GPS distance tracking.",
      },
    ],
  }),
  component: SafeZonesPage,
});

type ZoneFilter = "all" | "open" | "limited" | "closed";

const FILTERS: { id: ZoneFilter; label: string }[] = [
  { id: "all", label: "Show All" },
  { id: "open", label: "Open / Verified" },
  { id: "limited", label: "Open / Limited Capacity" },
  { id: "closed", label: "Closed" },
];

function SafeZonesPage() {
  const [filter, setFilter] = useState<ZoneFilter>("all");
  const { zones, loading } = useSafeZones();

  const { totalCapacity, districtsCovered } = useMemo(() => {
    let capacity = 0;
    const districts = new Set<string>();
    for (const z of zones) {
      capacity += z.capacity_persons;
      districts.add(z.district);
    }
    return { totalCapacity: capacity, districtsCovered: districts.size };
  }, [zones]);

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="05" label="SAFE ZONES" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold md:text-6xl">
                Safe Evacuation Spaces
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Locate the nearest safe evacuation space anywhere in Nepal during or after an
                earthquake — all 83 named open spaces across the Kathmandu Valley, plus
                province-wise coverage for the rest of the country. Enable location access to
                see live, sorted distances, or filter by province, district, or municipality.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
              <Radio className="h-4 w-4" /> Live GPS tracking
            </div>
          </div>

          {/* ── STATS STRIP ─────────────────────────────────────────── */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Verified Safe Zones
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                {loading ? <div className="h-9 w-24 animate-pulse rounded bg-muted" /> : <StatCounter value={zones.length} />}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                83 Kathmandu Valley + nationwide coverage
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Total Capacity
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                {loading ? <div className="h-9 w-32 animate-pulse rounded bg-muted" /> : <StatCounter value={totalCapacity} />}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Estimated persons across all open zones
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-chart-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Districts Covered
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                {loading ? <div className="h-9 w-16 animate-pulse rounded bg-muted" /> : <StatCounter value={districtsCovered} />}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                All 7 provinces · nationwide network
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-4 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              Icon: Navigation,
              title: "Live GPS tracking",
              text: "Your device's location is tracked continuously so distances update as you move.",
            },
            {
              Icon: MapPin,
              title: "Valley detail + nationwide coverage",
              text: "All 83 named open spaces across Kathmandu, Lalitpur, and Bhaktapur, plus a safe zone for every other district.",
            },
            {
              Icon: LifeBuoy,
              title: "Nearest-10 ranking",
              text: "Filter by province, or search by district or municipality, then see the 10 closest safe zones ranked by straight-line distance.",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-border bg-surface p-5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILTERS + MAP SECTION ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Filter pills */}
        <div
          className="flex flex-wrap items-center gap-2 mb-6"
          role="group"
          aria-label="Filter zones by availability status"
        >
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === option.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:block">
            Click a pin on the map to see zone details
          </span>
        </div>

        {/* Map + sidebar sliding layout — mirrors Damage Assessment */}
        <div className="mt-2">
          <EvacuationMap statusFilter={filter} />
        </div>

        {/* Map disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wide">Map Disclaimer: </span>
            The map boundaries and territorial representations displayed here are sourced from
            USGS (United States Geological Survey) and OpenStreetMap data feeds and{" "}
            <span className="font-semibold">
              may not reflect the official map of Nepal as published and recognised by the
              Government of Nepal (Survey Department, Ministry of Land Management)
            </span>
            . This portal does not endorse or validate any particular depiction of Nepal's
            international boundaries. For the official and legally recognised map of Nepal,
            please refer to the{" "}
            <span className="font-semibold">Survey Department of Nepal</span> at{" "}
            <span className="font-mono">survey.gov.np</span>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
