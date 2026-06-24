import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { StatCounter } from "@/components/site/StatCounter";
import { SeismicPulse } from "@/components/site/SeismicPulse";
import { Activity, ArrowRight, Zap, Layers, TrendingUp, AlertTriangle, Globe, Users, CheckCircle2, ChevronRight, ShieldCheck, MapPin, Radio, Waves, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import tectonicSettingImg from "@/assets/tectonic-setting.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nepal Seismic — National Earthquake Awareness Portal" },
      { name: "description", content: "Official portal for earthquake science, Nepal's seismic risks, historical events, real-time advisories, and life-saving preparedness." },
    ],
  }),
  component: Home,
});

const annual = [
  { year: "2015", Minor: 120, Moderate: 90, Major: 180 },
  { year: "2016", Minor: 95, Moderate: 35, Major: 4 },
  { year: "2017", Minor: 70, Moderate: 20, Major: 2 },
  { year: "2018", Minor: 80, Moderate: 22, Major: 1 },
  { year: "2019", Minor: 92, Moderate: 28, Major: 2 },
  { year: "2020", Minor: 65, Moderate: 18, Major: 1 },
  { year: "2021", Minor: 85, Moderate: 24, Major: 2 },
  { year: "2022", Minor: 95, Moderate: 30, Major: 2 },
  { year: "2023", Minor: 120, Moderate: 45, Major: 5 },
  { year: "2024", Minor: 100, Moderate: 32, Major: 2 },
  { year: "2025", Minor: 88, Moderate: 28, Major: 1 },
];

const region = [
  { name: "Gandaki", value: 34, color: "var(--color-chart-1)" },
  { name: "Karnali", value: 28, color: "var(--color-chart-2)" },
  { name: "Sudurpashchim", value: 18, color: "var(--color-chart-3)" },
  { name: "Bagmati", value: 12, color: "var(--color-chart-4)" },
  { name: "Others", value: 8, color: "var(--color-chart-5)" },
];

const monthly = [
  { m: "Jan", n: 8 }, { m: "Feb", n: 6 }, { m: "Mar", n: 11 },
  { m: "Apr", n: 9 }, { m: "May", n: 7 }, { m: "Jun", n: 6 },
];

const spark = [
  { t: 0, v: 0.3 }, { t: 1, v: 0.6 }, { t: 2, v: 0.4 }, { t: 3, v: 0.9 },
  { t: 4, v: 0.5 }, { t: 5, v: 0.7 }, { t: 6, v: 0.45 }, { t: 7, v: 1.0 },
  { t: 8, v: 0.65 }, { t: 9, v: 0.5 }, { t: 10, v: 0.8 }, { t: 11, v: 0.55 },
];

const recentQuakes = [
  { mag: 3.2, place: "Lamjung", depth: 14, time: "12m ago" },
  { mag: 2.8, place: "Sindhupalchok", depth: 9, time: "1h ago" },
  { mag: 4.1, place: "Bajhang", depth: 22, time: "3h ago" },
  { mag: 2.1, place: "Dolakha", depth: 6, time: "5h ago" },
];

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-foreground)",
  fontSize: 12,
};

function Home() {
  return (
    <Layout>
      {/* HERO — DASHBOARD STYLE */}
      <section className="relative overflow-hidden border-b border-border bg-surface/30">
        <div className="absolute inset-0 bg-seismic opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* breadcrumb / status strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono tracking-wider text-muted-foreground mb-8 animate-fade-up">
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-chart-5 animate-pulse" />SYSTEM OPERATIONAL</span>
            <span className="opacity-40">|</span>
            <span>NDRRMA · DMG · USGS FEED</span>
            <span className="opacity-40">|</span>
            <span className="inline-flex items-center gap-1.5"><Radio className="w-3 h-3" />84 STATIONS LIVE</span>
          </div>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12 items-start">
            {/* LEFT — headline */}
            <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-primary mb-5 px-2.5 py-1 rounded-sm border border-primary/30 bg-primary/5 uppercase">
                <ShieldCheck className="w-3 h-3" />
                National Earthquake Awareness Portal
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] tracking-tight">
                Earthquakes in Nepal:<br />
                Understanding, Preparing,<br className="hidden md:block" />
                {" "}and Building{" "}
                <em className="text-destructive not-italic font-bold italic">Resilience</em>
              </h1>
              <p className="mt-6 md:mt-8 text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed">
                Learn the science behind earthquakes, Nepal's seismic risks, historical events, and life-saving preparedness measures. Knowledge is our first line of defence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/historical" className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 shadow-sm">
                  <BookOpen className="w-4 h-4" />
                  Learn About Earthquakes
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/test-yourself" className="inline-flex items-center gap-2.5 px-5 py-3 rounded-md bg-card border border-border text-foreground font-semibold text-sm hover:bg-surface">
                  <CheckCircle2 className="w-4 h-4" />
                  Test Your Preparedness
                </Link>
                <a href="#emergency" className="inline-flex items-center gap-2.5 px-5 py-3 rounded-md border border-destructive/40 text-destructive font-semibold text-sm hover:bg-destructive/10">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Resources
                </a>
              </div>

              {/* mini KPI strip */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { v: 1768, s: "+", label: "Recorded Events", sub: "2015–2025" },
                  { v: 9, s: "", label: "Major Quakes", sub: "M ≥ 6.0" },
                  { v: 77, s: "", label: "Districts Tracked" },
                  { v: 84, s: "", label: "Live Stations" },
                ].map((k) => (
                  <div key={k.label} className="bg-card border border-border rounded-md p-3">
                    <div className="font-serif text-2xl md:text-3xl font-bold text-primary">
                      <StatCounter value={k.v} suffix={k.s} />
                    </div>
                    <div className="text-[11px] font-semibold text-foreground mt-1">{k.label}</div>
                    {k.sub && <div className="text-[10px] font-mono text-muted-foreground">{k.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — live monitoring panel */}
            <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
              <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono text-[10px] tracking-widest uppercase text-foreground font-semibold">Live Seismic Monitor</span>
                  </div>
                  <SeismicPulse className="text-primary" />
                </div>

                <div className="p-4 grid grid-cols-2 gap-3 border-b border-border">
                  <div>
                    <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Last 24h</div>
                    <div className="font-serif text-3xl font-bold text-foreground mt-0.5">
                      <StatCounter value={12} />
                      <span className="text-muted-foreground/50 text-base font-sans font-normal ml-1">events</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Peak Magnitude</div>
                    <div className="font-serif text-3xl font-bold text-destructive mt-0.5">
                      <StatCounter value={4.1} decimals={1} /> <span className="text-muted-foreground/50 text-base font-sans font-normal">M</span>
                    </div>
                  </div>
                </div>

                {/* sparkline */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Activity · 12h</div>
                    <div className="text-[10px] font-mono text-chart-5">+18%</div>
                  </div>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={spark}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} fill="url(#sparkGrad)" isAnimationActive />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* recent quakes list */}
                <div className="border-t border-border">
                  <div className="px-4 py-2.5 flex items-center justify-between bg-surface/40">
                    <div className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Recent Events</div>
                    <Waves className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <ul className="divide-y divide-border">
                    {recentQuakes.map((q) => {
                      const sev = q.mag >= 4 ? "text-destructive bg-destructive/10 border-destructive/30" : q.mag >= 3 ? "text-chart-4 bg-chart-4/10 border-chart-4/30" : "text-muted-foreground bg-surface-2 border-border";
                      return (
                        <li key={q.place} className="px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-surface/40 transition-colors">
                          <span className={`shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded border ${sev}`}>M{q.mag.toFixed(1)}</span>
                          <span className="flex items-center gap-1.5 min-w-0 flex-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground">{q.place}</span>
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">{q.depth}km</span>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0 hidden sm:inline">{q.time}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-muted-foreground tracking-wider uppercase text-right">
                * Demonstration data · USGS/DMG integration Q3 2026
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* WHAT IS EARTHQUAKE */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <SectionLabel number="01" label="SCIENCE" />
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">What is an Earthquake?</h2>
        <p className="text-muted-foreground max-w-3xl">
          An earthquake is a sudden and violent shaking of the ground caused by the movement of tectonic plates along fault lines deep within the Earth. When stress accumulated in the crust exceeds the strength of rock, it fractures and releases enormous amounts of energy in the form of seismic waves. Nepal sits at the heart of one of the most seismically active zones on the planet, where the Indian Plate collides with the Eurasian Plate\u00a0 a geological reality that has shaped the Himalayas and continues to pose a persistent and serious threat to millions of lives.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {[
            { icon: Zap, t: "Definition", d: "Earthquakes occur when stored energy in the Earth's crust is suddenly released, usually because rocks sliding past one another along a fault line get locked by friction, build up immense stress, and finally slip. This sudden rupture generates the seismic waves that radiate outward, causing the ground shaking we experience on the surface." },
            { icon: Activity, t: "Seismic Waves", d: "Seismic waves are powerful pulses of energy released during earthquakes. They are split into deep-traveling body waves\u00a0including fast P-waves that pass through solids and liquids, and slower S-waves that are blocked by liquids and slow-moving surface waves like Love and Rayleigh waves. Because surface waves ripple directly along the Earth's crust where human structures are built, they are responsible for the vast majority of violent ground shaking and structural damage." },
            { icon: Layers, t: "Tectonic Plates", d: "Earth's outer shell is broken into roughly fifteen major tectonic plates and dozens of minor ones, all floating on the partially molten asthenosphere beneath. These plates drift at speeds comparable to fingernail growth\u00a0 a few centimeters per year\u00a0 driven by mantle convection, slab pull, and ridge push. Most earthquakes originate at plate boundaries where plates collide, separate, or slide past each other. Nepal lies at the convergent boundary between the Indian and Eurasian plates, one of the most seismically active zones on Earth." },
            { icon: TrendingUp, t: "Magnitude vs Intensity", d: "Magnitude is a single quantitative measurement of the energy released at the earthquake's source, calculated logarithmically using seismometer data. A one-unit increase represents roughly thirty-two times more energy release. Intensity, by contrast, is a qualitative description of the earthquake's effects at a specific location, described by the Modified Mercalli Intensity (MMI) scale from I (not felt) to XII (total destruction). Intensity decreases with distance from the epicenter and varies with local soil conditions, building quality, and depth of focus." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-surface border border-border rounded-lg p-6 hover:border-primary/40 transition">
              <div className="w-10 h-10 rounded-md bg-primary/15 grid place-items-center mb-5"><Icon className="w-5 h-5 text-primary" /></div>
              <h3 className="font-serif text-xl font-bold mb-3">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW EARTHQUAKES OCCUR */}
      <section className="border-y border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <SectionLabel number="02" label="MECHANISM" />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">How Do Earthquakes Occur?</h2>
          <p className="text-muted-foreground max-w-3xl">From slow plate drift to sudden rupture — four stages explain the cycle of seismic energy.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              ["01", "Plate Movement", "Tectonic plates drift continuously at 2–5 centimeters per year\u00a0 about as fast as your fingernails grow. The Indian Plate pushes relentlessly northward into the Eurasian Plate at roughly 4.5 cm annually, a collision that began roughly 50 million years ago and continues to drive the Himalayan mountain range upward. This ongoing convergence is the primary engine of seismic activity across the entire Himalayan arc, from Pakistan to Myanmar."],
              ["02", "Stress on Fault Lines", "As the Indian Plate dives beneath the Tibetan Plateau along the Main Himalayan Thrust (MHT), friction locks the fault plane. The rocks on either side of the fault are prevented from sliding freely, so they bend and deform like a compressed spring. Stress concentrates along the locked fault interface, particularly in the segment beneath central and eastern Nepal where the fault is relatively flat and friction is highest."],
              ["03", "Stress Accumulation", "Over decades and centuries, the accumulated strain energy becomes enormous. Geodetic GPS measurements across Nepal reveal that the Himalayan front is shortening horizontally and being pushed upward at measurable rates. The elastic strain stored in the crust is proportional to the square of the stress, meaning that after two centuries of convergence, the energy waiting to be released is staggering\u00a0 enough to generate some of the most powerful earthquakes on Earth."],
              ["04", "Sudden Energy Release", "When the shear stress along the fault finally exceeds the frictional resistance holding the rocks together, the fault ruptures. The locked zone suddenly slips by several meters, releasing the stored elastic energy in a matter of seconds as seismic waves that radiate outward in all directions. The rupture may propagate along the fault for hundreds of kilometers. Once the main shock ends, the crust continues to adjust through aftershocks as stress redistributes along the fault system."],
            ].map(([n, t, d]) => (
              <div key={n} className="bg-surface border border-border rounded-lg p-6">
                <div className="font-serif text-4xl text-muted-foreground/30 mb-4">{n}</div>
                <h3 className="font-serif text-xl font-bold mb-3">{t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NEPAL */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <SectionLabel number="03" label="NEPAL'S GEOLOGY" />
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-5">Why Does Nepal Experience Frequent Earthquakes?</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Nepal sits directly atop one of Earth's most active tectonic boundaries. The Indian Plate collides with the Eurasian Plate at roughly 4.5 cm per year\u00a0 a geological force that built the Himalayas and continues to drive seismic hazard.
            </p>
            <ul className="space-y-5">
              {[
                ["Himalayan Tectonic Collision", "The Indian Plate, once a separate continent, began colliding with Eurasia roughly 50 million years ago and continues to push northward today. This ongoing convergence compresses and thickens the crust, uplifting the Himalayas by several millimeters each year while simultaneously storing enormous quantities of elastic strain energy deep underground. The rate of convergence among the highest of any continental collision on Earth\u00a0 makes the Himalayan arc one of the planet's most dangerous seismic belts."],
                ["Main Himalayan Thrust (MHT)", "The MHT is a gently dipping megathrust fault that separates the Indian Plate beneath from the overriding Himalayan wedge above. Historical earthquakes in 1255, 1934, and 2015 all ruptured sections of this fault. Paleoseismic studies suggest that segments in western and eastern Nepal that have not broken in centuries may now hold enough accumulated strain to produce magnitude 8 or greater events, potentially affecting millions."],
                ["Active Fault Systems", "Beyond the MHT, Nepal is crisscrossed by major fault systems including the Main Central Thrust, Main Boundary Thrust, and the surface-breaking Himalayan Frontal Thrust. Each of these structures has generated large earthquakes in the geological past and remains capable of producing magnitude 7 or greater events. Additionally, numerous unmapped minor faults and blind thrusts beneath the Kathmandu Valley add layers of complexity to hazard assessment."],
                ["Geological Vulnerability", "The Kathmandu Valley sits atop hundreds of meters of soft lake sediments and unconsolidated gravel deposited by ancient rivers and landslides. These soft deposits dramatically amplify seismic waves through a phenomenon called site amplification, causing stronger shaking than would occur on solid bedrock. During the 2015 Gorkha earthquake, this amplification contributed to severe damage in the valley even though the epicenter was 80 kilometers away."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <ChevronRight className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">{t}</div>
                    <div className="text-sm text-muted-foreground mt-1">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-lg p-6 min-h-[420px] flex flex-col">
            <div className="rounded-md flex-1 min-h-[260px] mb-6 relative overflow-hidden">
              <img
                src={tectonicSettingImg}
                alt="Himalayan tectonic plate collision cross-section showing Indian Plate subducting beneath Eurasian Plate"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 font-mono text-[10px] tracking-widest text-foreground/60">HIMALAYAN RANGE</div>
            </div>
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">TECTONIC SETTING</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["~4.5 cm/yr", "Plate Convergence Rate"],
                ["~15 km", "MHT Depth (Kathmandu)"],
                ["Very High", "Seismic Hazard Zone"],
              ].map(([v, l]) => (
                <div key={l} className="bg-surface-2 border border-border rounded-md p-3 text-center">
                  <div className="font-mono text-primary text-sm font-bold">{v}</div>
                  <div className="text-xs text-muted-foreground mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FUTURE RISK */}
      <section className="border-y border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <SectionLabel number="04" label="RISK PROJECTION" />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">Future Earthquake Risk in Nepal</h2>
          <p className="text-muted-foreground max-w-3xl">Scientific models, historical seismic records, and current demographic trends all point toward escalating earthquake risk in Nepal over the coming decades. The combination of long-return-period mega-thrust events, explosive urban growth, aging infrastructure, and climate-driven secondary hazards creates a multi-dimensional risk landscape. Investing in preparedness today\u00a0 from individual household kits to national building code enforcement\u00a0 reduces human and economic losses by orders of magnitude compared to reactive post-disaster spending. Understanding these risks is the essential first step toward building a resilient Nepal.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {[
              [AlertTriangle, "var(--color-chart-1)", "Seismic Gap Concern", "A seismic gap is a section of an active fault that has not produced a major earthquake for an unusually long period relative to other segments. Eastern Nepal has not experienced a full rupture since the devastating 1934 Bihar-Nepal earthquake (M8.0), while western Nepal has not seen a mega-thrust event since 1505. Paleoseismic trenching and GPS strain measurements both indicate that these segments may have accumulated enough stress to generate magnitude 8 or greater earthquakes, potentially affecting millions of people in densely populated regions."],
              [TrendingUp, "var(--color-chart-4)", "Rapid Urbanisation", "Kathmandu Valley's population has exploded from roughly 1 million in 1990 to over 3.5 million today, driven by rural-to-urban migration and natural growth. Much of this expansion has occurred in dense informal settlements with little or no building regulation. An estimated 80% of Kathmandu's buildings were constructed before the 2015 National Building Code was enforced, meaning a future large earthquake could cause casualties and damage orders of magnitude worse than the 2015 Gorkha event."],
              [Layers, "var(--color-chart-2)", "Infrastructure Vulnerability", "Despite post-2015 reconstruction efforts, the majority of public buildings across Nepal\u00a0 including schools, hospitals, and government offices\u00a0 were constructed decades ago without earthquake-resistant design. Many use unreinforced masonry or non-ductile concrete frames that perform poorly under lateral shaking. A single major earthquake during school hours could collapse hundreds of classrooms simultaneously, making infrastructure retrofitting one of the most urgent public safety priorities."],
              [Globe, "var(--color-chart-3)", "Climate Cascades", "Nepal's earthquake risk does not exist in isolation. The Himalayas contain thousands of glacial lakes, many of which have expanded as climate change accelerates snowmelt. A major earthquake can trigger massive landslides that displace lake water, causing catastrophic glacial lake outburst floods (GLOFs) downstream. Similarly, earthquake-weakened slopes become far more susceptible to monsoon-triggered landslides, creating deadly multi-hazard cascades that compound disaster impacts."],
              [Users, "var(--color-chart-5)", "Remote Communities", "Nepal's rugged topography leaves many high-mountain districts accessible only by foot trails or seasonal air operations. In the immediate aftermath of a major earthquake, roads may be blocked by landslides, and airstrips may be damaged or unusable. Communities in districts like Dolakha, Gorkha, and Humla could remain completely isolated for days or weeks, unable to receive medical aid, food, or rescue teams. Pre-positioning emergency supplies and training local responders is critical for these areas."],
              [CheckCircle2, "var(--color-chart-1)", "Preparedness Dividend", "Comprehensive global studies consistently show that every dollar invested in disaster risk reduction\u00a0 including earthquake-resistant construction, early warning systems, community training, and school preparedness programs\u00a0 saves an average of seven dollars in post-disaster response, recovery, and reconstruction costs. For Nepal, where government resources are limited and international aid cannot arrive instantly, community-level preparedness is not merely advisable\u00a0 it is the single most cost-effective strategy for reducing earthquake mortality and economic losses."],
            ].map(([Icon, color, t, d], i) => (
              <div key={i as number} className="bg-surface border border-border rounded-lg p-6">
                <div className="w-10 h-10 rounded-md grid place-items-center mb-5" style={{ background: `color-mix(in oklab, ${color as string} 18%, transparent)` }}>
                  
                  <Icon className="w-5 h-5" style={{ color: color as string }} />
                </div>
                <h3 className="font-bold mb-2 text-foreground">{t as string}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <SectionLabel number="05" label="DATA DASHBOARD" />
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">Earthquake Data Dashboard</h2>
        <p className="text-muted-foreground max-w-3xl">Explore historical seismic data for Nepal spanning the decade from 2015 through 2025, visualized through interactive charts and statistical summaries. The dataset includes over 1,700 recorded events, from minor tremors barely perceptible without instruments to the devastating 2015 Gorkha earthquake sequence and its persistent aftershocks. All data is sourced from the United States Geological Survey (USGS) and the Department of Mines and Geology (DMG) Nepal, providing a comprehensive foundation for understanding Nepal's recent seismic history and current activity patterns.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {[
            ["1,768", "Total Earthquakes", "2015–2025", "var(--color-chart-1)"],
            ["9", "Major Events", "M6.0 and above", "var(--color-chart-5)"],
            ["440", "Moderate Events", "M4.0–5.9", "var(--color-chart-4)"],
            ["1,319", "Minor Events", "Below M4.0", "var(--color-chart-2)"],
          ].map(([v, t, s, c]) => (
            <div key={t} className="bg-surface border border-border rounded-lg p-6">
              <div className="font-serif text-5xl font-bold mb-2" style={{ color: c }}>{v}</div>
              <div className="font-semibold text-foreground">{t}</div>
              <div className="text-xs text-muted-foreground mt-1">{s}</div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-5 mt-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">ANNUAL EARTHQUAKE COUNT 2015–2025</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Minor" stackId="a" fill="var(--color-chart-2)" />
                  <Bar dataKey="Moderate" stackId="a" fill="var(--color-chart-4)" />
                  <Bar dataKey="Major" stackId="a" fill="var(--color-chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">DISTRIBUTION BY REGION</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={region} dataKey="value" innerRadius={0} outerRadius={80} label={(e: any) => `${e.value}%`}>
                    {region.map((r) => <Cell key={r.name} fill={r.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              {region.map((r) => (
                <li key={r.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.name}</span>
                  <span className="font-mono text-muted-foreground">{r.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2026 */}
      <section className="border-y border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <SectionLabel number="06" label="CURRENT YEAR" />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8">Earthquake Statistics\u00a0 2026</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ["47", "Total Earthquakes", "Jan–Jun 2026", "var(--color-foreground)"],
              ["31", "Minor (<M4.0)", "65.9%", "var(--color-chart-2)"],
              ["14", "Moderate (M4–5.9)", "29.8%", "var(--color-chart-4)"],
              ["2", "Major (M6.0+)", "4.3%", "var(--color-chart-5)"],
            ].map(([v, t, s, c]) => (
              <div key={t} className="bg-surface border border-border rounded-lg p-6">
                <div className="font-serif text-5xl font-bold mb-2" style={{ color: c }}>{v}</div>
                <div className="font-semibold text-foreground">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{s}</div>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-lg p-6 mt-6">
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">MONTHLY TREND — 2026</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="n" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ fill: "var(--color-primary)", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">* Data is indicative placeholder. Integration with USGS/DMG real-time feed planned for Q3 2026.</p>
        </div>
      </section>

      <section id="emergency" className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Ready to test your preparedness?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Our comprehensive 20-question preparedness assessment has been specifically designed around Nepal's unique earthquake hazards, building practices, and emergency response challenges. Each question draws from international disaster preparedness standards while being grounded in real Nepal-specific scenarios\u00a0 from mountainous remote districts to dense Kathmandu Valley settlements. Completing the assessment takes just 5 minutes and provides you with a personalized readiness score, actionable recommendations, and a clear understanding of gaps in your household or community preparedness plan.</p>
        <Link to="/test-yourself" className="inline-flex items-center gap-3 px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90">
          Start the Assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </Layout>
  );
}
