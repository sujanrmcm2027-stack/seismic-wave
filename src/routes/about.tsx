import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { Target, Globe, Award, Users, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nepal Seismic Portal" },
      { name: "description", content: "Mission, vision, team, and partners behind Nepal's earthquake awareness and preparedness portal." },
    ],
  }),
  component: About,
});

const team = [
  ["Dr. Sita Thapa", "Seismologist & Lead Researcher", "Tribhuvan University, Dept. of Geology"],
  ["Ramesh Adhikari", "Disaster Risk Reduction Specialist", "NDRRMA Nepal"],
  ["Puja Shrestha", "Public Health & Community Resilience", "WHO Nepal Country Office"],
  ["Bikash Khatri", "Frontend Developer & UI Designer", "Open Source Contributor"],
];

const partners = [
  ["NDRRMA", "National Disaster Risk Reduction & Management Authority"],
  ["DMG Nepal", "Department of Mines and Geology"],
  ["Tribhuvan University", "Institute of Engineering & Applied Sciences"],
  ["USGS", "U.S. Geological Survey — Earthquake Hazards Program"],
  ["UNDRR", "United Nations Office for Disaster Risk Reduction"],
  ["Red Cross Nepal", "Nepal Red Cross Society"],
];

// Web3Forms access key — create one free at https://web3forms.com using your
// inbox (nepaljobmatchy@gmail.com). Submissions are emailed to the address tied
// to this key. The key is meant to be used in the browser and is safe to expose.
// Set VITE_WEB3FORMS_ACCESS_KEY in a .env file, or replace the fallback below.
const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "YOUR_WEB3FORMS_ACCESS_KEY";

function About() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("access_key", WEB3FORMS_ACCESS_KEY);
    data.append("from_name", "Nepal Seismic Portal");
    if (!data.get("subject")) {
      data.set("subject", "New message from the Nepal Seismic contact form");
    }

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <SectionLabel number="05" label="ABOUT" />
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">About This Portal</h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            A public-interest platform built to reduce earthquake casualties and improve community resilience across Nepal through education, data, and accessible preparedness tools.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            [Target, "Mission", "To provide accurate, accessible, and actionable earthquake information to every person in Nepal — regardless of location, literacy level, or internet access."],
            [Globe, "Vision", "A Nepal where earthquake preparedness is universal: every household has a plan, every community has capacity, and every building meets safety standards."],
            [Award, "Objectives", "Educate 5 million Nepalis on seismic science. Equip 500,000 households with preparedness knowledge. Support policymakers with open data and evidence."],
          ].map(([Icon, t, d]) => (
            <div key={t as string} className="bg-surface border border-border rounded-lg p-6">
              
              <Icon className="w-7 h-7 text-primary mb-5" />
              <h3 className="font-serif text-2xl font-bold mb-3">{t as string}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="05a" label="OUR RATIONALE" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Why This Portal Exists</h2>
        <div className="grid md:grid-cols-2 gap-10 text-foreground/85 leading-relaxed">
          <p>Nepal has suffered more than 10,000 deaths from earthquakes in the past decade alone. The 2015 Gorkha earthquake and 2023 Jajarkot earthquake revealed persistent gaps: insufficient public knowledge, inadequate household preparedness, and building stock that does not meet safety standards.</p>
          <p>This portal addresses the awareness gap directly — providing authoritative scientific content, historical records, interactive assessments, and community-specific guidance. We believe that informed communities survive disasters; unprepared communities are defeated by them.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="05b" label="OUR TEAM" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Researchers & Contributors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map(([n, r, o]) => (
            <div key={n} className="bg-surface border border-border rounded-lg p-6">
              <div className="w-14 h-14 rounded-full bg-surface-2 border border-border grid place-items-center mb-5"><Users className="w-6 h-6 text-muted-foreground" /></div>
              <h3 className="font-bold text-foreground">{n}</h3>
              <div className="text-sm text-primary mt-1">{r}</div>
              <div className="text-xs text-muted-foreground mt-2">{o}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="05c" label="PARTNERS" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Partner Organisations</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map(([n, d]) => (
            <div key={n} className="bg-surface border border-border rounded-lg p-5 flex gap-4">
              <Globe className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">{n}</h3>
                <p className="text-sm text-muted-foreground mt-1">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="05d" label="CONTACT" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Get in Touch</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="FULL NAME"><input name="name" required className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" placeholder="Your name" /></Field>
              <Field label="EMAIL"><input name="email" required type="email" className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" placeholder="you@example.com" /></Field>
            </div>
            <Field label="SUBJECT"><input name="subject" className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" placeholder="Research enquiry / Feedback / Partnership" /></Field>
            <Field label="MESSAGE"><textarea name="message" required rows={5} className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none" placeholder="Your message..." /></Field>
            <button disabled={status === "sending"} className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
              {status === "sending" ? "Sending…" : status === "success" ? "Message Sent ✓" : "Send Message"}
            </button>
            {status === "success" && (
              <p className="text-sm text-primary">Thanks — your message has been sent. We'll be in touch.</p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">Something went wrong sending your message. Please try again.</p>
            )}
          </form>
          
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs tracking-widest text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}

function ContactCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex gap-4">
      <Icon className="w-5 h-5 text-primary mt-1 shrink-0" />
      <div>
        <div className="font-mono text-xs tracking-widest text-muted-foreground">{label}</div>
        <div className="text-foreground font-semibold mt-1">{value}</div>
      </div>
    </div>
  );
}
