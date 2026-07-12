import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { EvacuationMap } from "@/components/site/EvacuationMap";
import { LifeBuoy, MapPin, Navigation } from "lucide-react";

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

const highlights = [
  {
    title: "Live GPS tracking",
    text: "Your device's location is tracked continuously so distances update as you move.",
    Icon: Navigation,
  },
  {
    title: "Valley detail + nationwide coverage",
    text: "All 83 named open spaces across Kathmandu, Lalitpur, and Bhaktapur (grouped under Bagmati Province), plus a safe zone for every other district in Nepal.",
    Icon: MapPin,
  },
  {
    title: "Nearest-10 ranking",
    text: "Filter by province, or search by district or municipality, then see the 10 closest safe zones ranked by straight-line distance.",
    Icon: LifeBuoy,
  },
];

function SafeZonesPage() {
  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="05" label="SAFE ZONES" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold md:text-6xl">Safe Evacuation Spaces</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Locate the nearest safe evacuation space anywhere in Nepal during or after an
                earthquake — all 83 named open spaces across the Kathmandu Valley, plus
                province-wise coverage for the rest of the country. Enable location access to see
                live, sorted distances, or filter by province, district, or municipality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, text, Icon }) => (
            <div key={title} className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <EvacuationMap />
      </section>
    </Layout>
  );
}
