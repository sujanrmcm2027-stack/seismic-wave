import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { GisMap } from "@/components/site/GisMap";
import { Compass, AlertTriangle, ShieldCheck, Radio } from "lucide-react";

export const Route = createFileRoute("/gis")({
  head: () => ({
    meta: [
      { title: "GIS Hazard Map: Nepal Seismic" },
      { name: "description", content: "Interactive GIS view of Nepal's seismic hazard zones, exposure hotspots, and preparedness planning areas." },
    ],
  }),
  component: GisPage,
});

const layers = [
  { title: "Seismic belts", text: "High-risk corridors along major faults and thrusts are highlighted for planning and outreach." },
  { title: "Urban exposure", text: "Dense settlements and critical infrastructure clusters show where preparedness is most urgent." },
  { title: "Response planning", text: "The map is designed to support district-level drills, school safety planning, and emergency response." },
];

function GisPage() {
  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="03" label="GIS MAPPING" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold md:text-6xl">Worldwide Seismic GIS</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                View live worldwide earthquake data from official public feeds, with Nepal hazard context and a dynamic tracking layer for awareness and planning.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Compass className="h-4 w-4" /> Spatial planning dashboard
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {layers.map((layer) => (
            <div key={layer.title} className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {layer.title.includes("Seismic") ? <AlertTriangle className="h-5 w-5" /> : layer.title.includes("Urban") ? <ShieldCheck className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{layer.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
        <GisMap />
      </section>

      {/* Map disclaimer — Government of Nepal */}
      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4">
          <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wide">Map Disclaimer: </span>
            The map boundaries and territorial representations displayed here are sourced from USGS (United States Geological Survey) and OpenStreetMap data feeds and
            <span className="font-semibold"> may not reflect the official map of Nepal as published and recognised by the Government of Nepal (Survey Department, Ministry of Land Management)</span>.
            This portal does not endorse or validate any particular depiction of Nepal's international boundaries. For the official and legally recognised map of Nepal,
            please refer to the <span className="font-semibold">Survey Department of Nepal</span> at <span className="font-mono">survey.gov.np</span>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
