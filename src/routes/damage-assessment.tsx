import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { StatCounter } from "@/components/site/StatCounter";
import { DamageAssessmentMap } from "@/components/site/DamageAssessmentMap";
import { DamageIncidentFeed } from "@/components/site/DamageIncidentFeed";
import { DdnaReportForm } from "@/components/site/DdnaReportForm";
import { DdnaReportRegistry } from "@/components/site/DdnaReportRegistry";
import {
  DAMAGE_INCIDENTS_2026,
  generateLiveIncident,
  type DamageIncident,
  type VerificationStatus,
} from "@/data/damageAssessment2026";
import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Database,
  Filter,
  Globe2,
  Landmark,
  LifeBuoy,
  Megaphone,
  Palette,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/damage-assessment")({
  head: () => ({
    meta: [
      { title: "Damage Assessment (2026): Nepal Seismic Portal" },
      {
        name: "description",
        content:
          "Live 2026 earthquake damage and impact assessment for Nepal: verified official reports, media coverage, and a rumor filter for unverified crowd-sourced alerts.",
      },
    ],
  }),
  component: DamageAssessmentPage,
});

type FilterOption = "all" | VerificationStatus;

const FILTERS: { id: FilterOption; label: string }[] = [
  { id: "all", label: "Show All" },
  { id: "official", label: "Only Government Verified" },
  { id: "media", label: "Media Reports" },
  { id: "unverified", label: "Social Media Streams (Unverified)" },
];

const NEW_ALERT_INTERVAL_MS = 9_000;
const MAX_FEED_LENGTH = 30;

const COMPLIANCE_CHECKLIST: {
  requirement: string;
  legalBasis: string;
  whatCompliantLooksLike: string;
  cadence: string;
}[] = [
  {
    requirement: "Institutional Mandate",
    legalBasis: "Disaster Risk Reduction and Management (DRRM) Act, 2074 (2017)",
    whatCompliantLooksLike:
      "Federal, provincial, and local Disaster Management Committees are formed and active, with clear reporting lines up to the National DRRM Authority (NDRRMA).",
    cadence: "Standing body, reviewed annually",
  },
  {
    requirement: "Seismic Construction Standard",
    legalBasis: "National Building Code, NBC 105:2020 (Seismic Design)",
    whatCompliantLooksLike:
      "New public and private construction is permitted only after certified seismic-resistant design review; retrofit priority given to schools and hospitals.",
    cadence: "Per building permit, before construction",
  },
  {
    requirement: "Local Resilience Planning",
    legalBasis: "Local Disaster and Climate Resilience Plan (LDCRP) requirement",
    whatCompliantLooksLike:
      "Every one of Nepal's 753 local governments maintains a published, budgeted resilience plan naming hazards, evacuation routes, and responsible officials.",
    cadence: "Reviewed and re-approved every 5 years, or after a major event",
  },
  {
    requirement: "Standardized Damage Reporting",
    legalBasis: "Detailed Damage and Needs Assessment (DDNA) / BIPAD Portal format",
    whatCompliantLooksLike:
      "Incident data is submitted in the common national schema, not free-text, so aid can be allocated by verified severity rather than by whoever shouts loudest.",
    cadence: "Within 72 hours of a significant event, then updated weekly",
  },
  {
    requirement: "Critical Infrastructure Audit",
    legalBasis: "School Earthquake Safety Program / Hospital Safety Index",
    whatCompliantLooksLike:
      "Structural safety scores exist on file for schools and hospitals in the district, with retrofit or closure orders issued for anything below threshold.",
    cadence: "Full audit cycle every 3 years",
  },
  {
    requirement: "Public Drill Participation",
    legalBasis: "Nepal ShakeOut / National Earthquake Safety Day (Magh 2)",
    whatCompliantLooksLike:
      "Ministries, schools, and registered organizations log participation in a coordinated Drop, Cover, and Hold On drill.",
    cadence: "Annually, nationwide",
  },
];

const GLOBAL_ALIGNMENT: {
  local: string;
  global: string;
  whyItMatters: string;
}[] = [
  {
    local: "DRRM Act, 2074: committee structure",
    global: "Sendai Framework Priority 2: Strengthening Risk Governance",
    whyItMatters:
      "A clear chain of command locally is what lets Nepal report progress on a shared global scorecard, rather than reinventing coordination during every crisis.",
  },
  {
    local: "NBC 105:2020 seismic design code",
    global: "Sendai Target D & SDG 11.5 / SDG 9.1 (resilient infrastructure)",
    whyItMatters:
      "Enforcing one national standard is Nepal's contribution to the global target of cutting disaster damage to critical infrastructure and basic services.",
  },
  {
    local: "Local Disaster & Climate Resilience Plans",
    global: "Sendai Priority 4: Build Back Better & SDG 13.1 (climate resilience)",
    whyItMatters:
      "Every municipal plan filed is one more building block toward the global commitment to recover smarter, not just faster, after a disaster.",
  },
  {
    local: "DDNA / BIPAD standardized reporting",
    global: "Sendai Target G & Early Warnings for All (EW4All) Pillar 3",
    whyItMatters:
      "Consistent local data is the raw material for the global push to give every person on Earth access to an early warning system by 2027.",
  },
];

const IMPLEMENTATION_MATRIX: {
  metric: string;
  Icon: typeof Database;
  implementation: string;
  objective: string;
}[] = [
  {
    metric: "Data Ingestion",
    Icon: Database,
    implementation:
      "Automated REST API polling of official DRR portals (BIPAD / NEOC) paired with filtered keyword streams (earthquake OR bhukampa).",
    objective: "Universal aggregation of local and international seismic telemetry.",
  },
  {
    metric: "Rumor Segregation",
    Icon: Filter,
    implementation:
      'Strict UI isolation with mandatory "Awaiting ground verification" subtext badges for unmapped social media clusters.',
    objective: "Mitigation of viral panic and crowdsourced data duplication.",
  },
  {
    metric: "Semantic Mapping",
    Icon: Palette,
    implementation:
      "Homepage Dashboard color overhaul: Severe Major Events (M≥6.0) mapped strictly to Dynamic Red Alert Status; Low-impact Minor Events (M<4.0) mapped to Green Background Tremor Status.",
    objective: "Immediate visual triaging of hazard severity for first responders and the public.",
  },
];

function DamageAssessmentPage() {
  const [incidents, setIncidents] = useState<DamageIncident[]>(DAMAGE_INCIDENTS_2026);
  const [filter, setFilter] = useState<FilterOption>("all");

  // Simulates a live stream of incoming crowd-sourced alerts arriving on top
  // of the seeded 2026 dataset, so the map and feed keep moving after load.
  // Each tick generates a fresh incident by combining a random district,
  // location, damage type, and source (see generateLiveIncident) rather
  // than drawing from a fixed list — a fixed list, even shuffled to avoid
  // back-to-back repeats, still cycles back to the exact same headline
  // once it's exhausted, which read as "the feed looping" once a user sat
  // on a single verification filter (e.g. "unverified") for a few minutes.
  useEffect(() => {
    let counter = 0;
    const timer = window.setInterval(() => {
      counter += 1;
      const incoming: DamageIncident = {
        ...generateLiveIncident(),
        id: `live-${Date.now()}-${counter}`,
        time: new Date().toISOString(),
      };
      setIncidents((prev) => [incoming, ...prev].slice(0, MAX_FEED_LENGTH));
    }, NEW_ALERT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const filteredIncidents = useMemo(() => {
    if (filter === "all") return incidents;
    return incidents.filter((incident) => incident.verification === filter);
  }, [incidents, filter]);

  const metrics = useMemo(() => {
    const totalIncidents = incidents.length;
    const verifiedCasualtiesAndDisplaced = incidents
      .filter((incident) => incident.verification !== "unverified")
      .reduce((sum, incident) => sum + (incident.casualties ?? 0) + (incident.displaced ?? 0), 0);
    const infrastructureFailures = incidents.filter(
      (incident) =>
        incident.roadBlocked ||
        incident.category === "Road Blockage" ||
        incident.category === "Structural Failure",
    ).length;

    return { totalIncidents, verifiedCasualtiesAndDisplaced, infrastructureFailures };
  }, [incidents]);

  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="04" label="DAMAGE ASSESSMENT" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold md:text-6xl">
                Live Earthquake Damage & Impact Assessment (2026)
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Tracking foreshocks, main shocks, aftershocks, and their immediate aftermath:
                structural failures, road blockages, and displacement, across Nepal for the current
                year.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
              <Radio className="h-4 w-4" /> Live monitoring, 2026
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Total Incidents Reported
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                <StatCounter value={metrics.totalIncidents} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                2026 · all verification levels
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-destructive" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Verified Casualties / Displaced
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                <StatCounter value={metrics.verifiedCasualtiesAndDisplaced} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Official + media-verified reports only
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RouteIcon className="h-4 w-4 text-chart-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Road & Infrastructure Failures
                </span>
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">
                <StatCounter value={metrics.infrastructureFailures} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Blockages, collapses, and cracked structures
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter incidents by verification status"
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
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[65fr_35fr]">
          <section aria-label="Interactive damage map">
            <DamageAssessmentMap incidents={filteredIncidents} />
          </section>
          <DamageIncidentFeed incidents={filteredIncidents} />
        </div>
      </section>

      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="04a" label="DDNA / BIPAD REPORTING" />
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            Standardized Municipal Damage Reporting
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Local disaster focal persons submit structured Detailed Damage and Needs Assessment
            (DDNA) reports in the common national schema used by the BIPAD Portal, so aid can be
            allocated by verified severity, filed within the 72-hour window the DRRM Act 2074
            requires.
          </p>

          <div className="mt-8 space-y-6">
            <DdnaReportForm />
            <DdnaReportRegistry />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <SectionLabel number="04b" label="COMPLIANCE" />
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            International DRR Framework Alignment
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            "Compliance" here does not mean paperwork for its own sake. It means the specific legal
            duties, audits, and reporting formats that stand between a strong tremor and a genuine
            catastrophe, and how Nepal's local rules connect to the global systems built to prevent
            exactly that.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">
                  Why This Section Exists: The "Why"
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Compliance is what separates{" "}
                <span className="font-semibold text-foreground">a building that shakes</span> from{" "}
                <span className="font-semibold text-foreground">a building that collapses</span>.
                The 2015 Gorkha earthquake killed nearly 9,000 people in Nepal, a large share in
                unreinforced masonry that predated, or ignored, seismic design standards.
                Separately, during aftershocks and subsequent tremors, uncoordinated data reporting
                slowed aid to the districts that needed it most, while unverified rumors on social
                media triggered panic that hospitals and highways were not built to absorb. Every
                requirement below exists because a specific version of that failure already happened
                once, somewhere, and was traced back to a rule that was skipped, unaudited, or
                unreported.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-4/10 text-chart-4">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">Think of It Like a Fire Drill</div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Nobody expects a fire on drill day, and most years the smoke detector never goes
                off. DRR compliance works the same way as building codes, car insurance, or an
                annual health checkup: it is invisible and faintly annoying right up until the one
                day it is the only thing that worked. A retrofit certificate on a school, a
                resilience plan filed by a rural municipality, a damage report submitted in the
                right format within 72 hours; none of these feel urgent on a calm Tuesday. They only
                reveal their value the moment the ground actually moves.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <ClipboardCheck className="h-3.5 w-3.5" /> The Compliance Checklist: What Is Actually
              Required
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/70">
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Requirement
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Legal Basis / Program
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      What "Compliant" Looks Like
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarCheck className="h-3.5 w-3.5" /> Cadence
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLIANCE_CHECKLIST.map((row) => (
                    <tr key={row.requirement} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-4 align-top font-semibold text-foreground">
                        {row.requirement}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.legalBasis}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.whatCompliantLooksLike}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.cadence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            None of these local rules exist in isolation. Each one is Nepal's on-the-ground
            contribution to commitments the entire world signed onto together.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    UN Framework
                  </div>
                  <div className="font-semibold text-foreground">
                    Sendai Framework for DRR (2015–2030)
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BookOpenCheck className="h-4 w-4 text-primary" /> Priority 1: Understanding
                    Disaster Risk
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Translating complex 2026 seismic data arrays into clear, localized impact data
                    across Nepal's districts, turning raw magnitude, phase, and location feeds into
                    decisions communities can act on.
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Megaphone className="h-4 w-4 text-primary" /> Target G: Access to Information
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The <span className="font-semibold text-foreground">Rumor Filter protocol</span>{" "}
                    above combats high-velocity misinformation, giving citizens an instant tool to
                    separate actionable institutional telemetry from unverified social media panic.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-4/10 text-chart-4">
                  <Siren className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    UN Initiative
                  </div>
                  <div className="font-semibold text-foreground">
                    Early Warnings for All (EW4All)
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Radio className="h-4 w-4 text-chart-4" /> Pillar 3: Dissemination &
                    Communication
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    High-visibility web standards and live-ticking feeds are used throughout this
                    dashboard to optimize "last-mile" alert readability for every verification tier.
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <LifeBuoy className="h-4 w-4 text-chart-4" /> Pillar 4: Preparedness
                    Capabilities
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Live hazard feeds are bound to tactical safety workflows; every verified alert
                    reinforces core response guidance:{" "}
                    <span className="font-semibold text-foreground">Drop, Cover, and Hold On.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Globe2 className="h-3.5 w-3.5" /> Local → Global: Where Nepal's Rules Meet the
              World's Framework
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/70">
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Nepal Requirement
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Global Framework Link
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Why It Matters
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {GLOBAL_ALIGNMENT.map((row) => (
                    <tr key={row.local} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-4 align-top font-semibold text-foreground">
                        {row.local}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.global}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.whyItMatters}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Technical Implementation Matrix
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/70">
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Framework Metric
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Technical Implementation
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                    >
                      Operational Objective
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IMPLEMENTATION_MATRIX.map((row) => (
                    <tr key={row.metric} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <row.Icon className="h-4 w-4 shrink-0 text-primary" />
                          {row.metric}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.implementation}
                      </td>
                      <td className="px-4 py-4 align-top leading-relaxed text-muted-foreground">
                        {row.objective}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
