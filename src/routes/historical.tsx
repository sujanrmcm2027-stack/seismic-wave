import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import gorkhaImg from "@/assets/gorkha.png";
import jajarkotImg from "@/assets/jajarkot.png";

export const Route = createFileRoute("/historical")({
  head: () => ({
    meta: [
      { title: "Historical Earthquakes — Nepal Seismic" },
      { name: "description", content: "Case studies of the 2015 Gorkha and 2023 Jajarkot earthquakes with damage statistics and lessons learned." },
    ],
  }),
  component: HistoricalPage,
});

type Event = {
  id: string; year: string; mag: string; name: string; date: string; img: string;
  intro: string; stats: [string, string][]; lessons: string[];
};

const events: Event[] = [
  {
    id: "gorkha", year: "2015 Gorkha", mag: "M7.8 Mw", name: "2015 Gorkha Earthquake", date: "25 April 2015, 11:56 NST",
    img: gorkhaImg,
    intro: "The most devastating earthquake to strike Nepal in 80 years. A M7.8 rupture on the Main Himalayan Thrust caused catastrophic building collapse across 14 districts, destroyed 600,000 houses, and triggered landslides that buried entire villages. The cultural heart of Kathmandu Durbar Squares, Dharahara Tower was irreparably damaged.",
    stats: [
      ["Epicenter", "Gorkha District, 77 km NW of Kathmandu"],
      ["Focal Depth", "8.2 km"],
      ["Deaths", "8,964"], ["Injured", "21,952+"], ["Displaced", "2.8 million"],
      ["Economic Loss", "USD 7.1 billion (≈35% of GDP)"],
      ["Heritage Sites", "700+ cultural heritage structures damaged"],
      ["Notable Aftershock", "Major M7.3 aftershock on 12 May 2015"],
    ],
    lessons: [
      "Unregulated construction in Kathmandu Valley greatly amplified losses",
      "Community-level preparedness saved lives where drills had been conducted",
      "Medical surge capacity in Kathmandu hospitals was overwhelmed within hours",
      "Remote mountain villages remained inaccessible for days without air support",
      "Early warning and real-time seismic monitoring infrastructure was absent",
    ],
  },
  {
    id: "jajarkot", year: "2023 Jajarkot", mag: "M6.4 Mw", name: "2023 Jajarkot Earthquake", date: "3 November 2023, 23:47 NST",
    img: jajarkotImg,
    intro: "Striking in the dead of night, the M6.4 Jajarkot earthquake devastated remote Karnali Province. Traditional stone-and-mud structures — unchanged since pre-2015 policies — pancaked under the shaking. The area's inaccessibility compounded loss of life and delayed relief for days.",
    stats: [
      ["Epicenter", "Jajarkot District, Karnali Province"],
      ["Focal Depth", "10 km"],
      ["Deaths", "154"], ["Injured", "365+"], ["Displaced", "~400,000"],
      ["Economic Loss", "USD 73 million (preliminary estimate)"],
      ["Most Affected", "Jajarkot and Rukum West districts most severely impacted"],
      ["Aftershocks", "19 aftershocks of M4.0+ within 24 hours"],
    ],
    lessons: [
      "Night-time earthquakes increase casualties as people are in vulnerable sleeping positions",
      "Remote Karnali geography delayed relief by up to 72 hours",
      "Traditional stone-and-mud construction remained prevalent despite post-2015 policies",
      "Mobile early warning alerts reached some urban areas but not remote villages",
      "Community-based disaster management committees proved effective where formed",
    ],
  },
];

const compareData = [
  { metric: "Deaths", "2015 Gorkha": 8964, "2023 Jajarkot": 154 },
  { metric: "Injured", "2015 Gorkha": 21952, "2023 Jajarkot": 365 },
  { metric: "Displaced (x1000)", "2015 Gorkha": 2800, "2023 Jajarkot": 400 },
];

function HistoricalPage() {
  const [tab, setTab] = useState<"gorkha" | "jajarkot" | "compare">("gorkha");
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-20">
        <div className="inline-flex bg-surface border border-border rounded-lg p-1 mb-10">
          {[
            ["gorkha", "2015 Gorkha"],
            ["jajarkot", "2023 Jajarkot"],
            ["compare", "Comparison"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab !== "compare" && (() => {
          const ev = events.find((e) => e.id === tab)!;
          return (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-lg overflow-hidden border border-border h-72 md:h-96 bg-surface">
                  <img src={ev.img} alt={ev.name} className="w-full h-full object-cover" />
                </div>
                <div className="bg-surface border border-border rounded-lg p-6">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="font-mono text-sm text-destructive bg-destructive/15 border border-destructive/30 rounded px-2 py-1">{ev.mag}</span>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold">{ev.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                    <Calendar className="w-4 h-4" /> {ev.date}
                  </div>
                  <p className="text-foreground/85 leading-relaxed">{ev.intro}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="font-serif text-xl font-bold mb-5">Key Lessons from {ev.id === "gorkha" ? "2015" : "Jajarkot 2023"}</h3>
                  <ol className="space-y-3">
                    {ev.lessons.map((l, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="font-mono text-xs text-primary mt-1">0{i + 1}</span>
                        <span className="text-foreground/85">{l}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <aside className="space-y-3">
                {ev.stats.map(([k, v]) => (
                  <div key={k} className="bg-surface border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">{k}</div>
                    <div className={`font-semibold ${k === "Deaths" ? "text-destructive font-mono text-lg" : "text-foreground"}`}>{v}</div>
                  </div>
                ))}
              </aside>
            </div>
          );
        })()}

        {tab === "compare" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((e) => (
                <div key={e.id} className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="font-serif text-2xl text-primary font-bold mb-5">{e.year}</h3>
                  <ul className="divide-y divide-border">
                    {[
                      ["Magnitude", e.id === "gorkha" ? "M7.8" : "M6.4"],
                      ["Deaths", e.id === "gorkha" ? "8,964" : "154"],
                      ["Displaced", e.id === "gorkha" ? "2.8M" : "~400K"],
                      ["Economic Loss", e.id === "gorkha" ? "USD 7.1B" : "USD 73M"],
                      ["Affected Area", e.id === "gorkha" ? "14 districts" : "2 districts"],
                    ].map(([k, v]) => (
                      <li key={k} className="flex justify-between py-3">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-foreground">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="font-serif text-xl font-bold mb-5">Comparative Statistics</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0b1826", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="2015 Gorkha" fill="var(--color-destructive)" />
                    <Bar dataKey="2023 Jajarkot" fill="var(--color-chart-4)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
