import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import {
  Target,
  Globe,
  Award,
  Mail,
  Phone,
  MapPin,
  User,
  Linkedin,
  Github,
  Instagram,
} from "lucide-react";
import { useState } from "react";
import dhanRajPhoto from "@/assets/team/dhan-raj-tamang.png";
import sujanPhoto from "@/assets/team/sujan-rayamajhi.jpeg";
import somPhoto from "@/assets/team/som-prasad-sapkota.jpeg";
import pramodPhoto from "@/assets/team/pramod-ghimire.jpeg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About: Nepal Seismic Portal" },
      {
        name: "description",
        content:
          "Mission, vision, team, and partners behind Nepal's earthquake awareness and preparedness portal.",
      },
    ],
  }),
  component: About,
});

// Web3Forms access key — create one free at https://web3forms.com using your
// inbox (nepaljobmatchy@gmail.com). Submissions are emailed to the address tied
// to this key. The key is meant to be used in the browser and is safe to expose.
// Set VITE_WEB3FORMS_ACCESS_KEY in a .env file, or replace the fallback below.
const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "YOUR_WEB3FORMS_ACCESS_KEY";

const TEAM = [
  {
    name: "Sujan Rayamajhi",
    photo: sujanPhoto,
    role: "Project Lead | B.A. in Social Work & Rural Development | Master's in Crisis Management Student",
    bio: "Sujan is a Master's student in Crisis Management who served as Project Lead for this portal, driving its research, content, and coordination frameworks. He is currently General Manager at JobMatchy Nepal, bringing strategic leadership and platform coordination experience. Holding a Bachelor's in Social Work and Rural Development, he brings hands-on humanitarian experience as a freelance psychosocial counselor and community crisis volunteer. Passionate about GIS and spatial data analysis, Sujan bridges executive leadership and disaster risk reduction with grassroots mobilization to strengthen local resilience and support vulnerable communities.",
    links: {
      linkedin: "https://www.linkedin.com/in/sujan-rayamajhi-7b72a4319",
      github: "https://github.com/sujanrmcm2027-stack",
      instagram: "https://www.instagram.com/Iamsujan.jr",
    },
  },
  {
    name: "Pramod Ghimire",
    photo: pramodPhoto,
    role: "Supply Chain Management Professional, World Vision International Nepal | Crisis Management Student",
    bio: "Pramod is a Supply Chain Management professional at World Vision International Nepal and a Crisis Management student. He contributed to the portal's research, content development, and humanitarian logistics strategies. Specializing in emergency logistics, he combines field experience in procurement and emergency response with academic training in disaster risk reduction. Pramod is dedicated to strengthening Nepal's disaster preparedness through technology and data-driven insights that boost community resilience and streamline emergency response.",
    links: { linkedin: "https://www.linkedin.com/in/pramod-ghimire-4b59521aa/" },
  },
  {
    name: "Som Prasad Sapkota",
    photo: somPhoto,
    role: "Contributing Expert | Former Nepali Army Officer & Disaster Responder",
    bio: "Som serves as a Contributing Expert, drawing on a 20-year career in the Nepali Army to provide historical seismic data and build civil-military coordination mechanisms. A veteran responder, he led frontline rescue operations in Sindhupalchok during the 2015 earthquake and served as a UN Military Police Investigator in Central Africa. Som is committed to ensuring this portal bridges historical emergency data with active frontline responders to better prepare Nepal for future crises.",
    links: {},
  },
  {
    name: "Dhan Raj Tamang",
    photo: dhanRajPhoto,
    role: "Academic Administration Specialist & Disaster Risk Management Liaison",
    bio: "Dhan Raj is an education professional specializing in academic administration, strategic planning, and institutional leadership. He serves as a bridge between disaster risk management organizations, academic institutions, and local communities, facilitating capacity-building initiatives and multi-stakeholder collaborations that integrate safety with education. He is committed to fostering resilient learning environments and cultivating long-term community preparedness against future hazards.",
    links: {},
  },
];

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
          <SectionLabel number="08" label="ABOUT" />
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">About This Portal</h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            A public interest platform built to reduce earthquake casualties and improve community
            resilience across Nepal through education, data, and accessible preparedness tools.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {(
            [
              {
                Icon: Target,
                title: "Mission",
                description:
                  "To provide accurate, accessible, and actionable earthquake information to every person in Nepal regardless of location, literacy level, or internet access.",
              },
              {
                Icon: Globe,
                title: "Vision",
                description:
                  "A Nepal where earthquake preparedness is universal: every household has a plan, every community has capacity, and every building meets safety standards.",
              },
              {
                Icon: Award,
                title: "Objectives",
                description: [
                  "Educate **30 million Nepalis** on seismic science and hazard awareness.",
                  "Equip **500,000 households** with practical preparedness knowledge.",
                  "Support policymakers with open data and evidence-based guidance.",
                ],
              },
            ] as const
          ).map(({ Icon, title, description }) => (
            <div key={title} className="bg-surface border border-border rounded-lg p-6">
              <Icon className="w-7 h-7 text-primary mb-5" />
              <h3 className="font-serif text-2xl font-bold mb-3">{title}</h3>
              {Array.isArray(description) ? (
                <ul className="space-y-2.5">
                  {description.map((item) => {
                    const parts = item.split("**");
                    return (
                      <li
                        key={item}
                        className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>
                          {parts.map((part: string, i: number) =>
                            i % 2 === 1 ? (
                              <strong key={i} className="text-foreground font-semibold">
                                {part}
                              </strong>
                            ) : (
                              part
                            ),
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="08a" label="OUR RATIONALE" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Why This Portal Exists</h2>
        <div className="grid md:grid-cols-2 gap-10 text-foreground/85 leading-relaxed">
          <p>
            Nepal has suffered more than 10,000 deaths from earthquakes in the past decade alone.
            The 2015 Gorkha earthquake and 2023 Jajarkot earthquake revealed persistent gaps:
            insufficient public knowledge, inadequate household preparedness, and building stock
            that does not meet safety standards.
          </p>
          <p>
            This portal addresses the awareness gap directly, providing authoritative scientific
            content, historical records, interactive assessments, and community specific guidance.
            We believe preparedness is power: when communities understand the risk, they can act
            decisively, protect one another, and turn the next earthquake into an event they
            withstand rather than one that defines them.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="08b" label="A HISTORICAL LESSON" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
          The 1988 Nepal Earthquake
        </h2>
        <div className="grid md:grid-cols-2 gap-10 text-foreground/85 leading-relaxed">
          <p>
            Nowhere is the case for preparedness clearer than in Nepal's own history. The 1988 Nepal
            earthquake, also remembered as the 2045 BS earthquake, struck the western parts of Nepal
            and caused widespread damage in the affected districts. It remains one of the most
            significant earthquakes in Nepal's modern history because it exposed the vulnerability
            of rural settlements, traditional masonry buildings, and local response systems.
          </p>
          <p>
            The event reinforced the need for stronger building practices, better public awareness,
            and faster coordination between local communities, government agencies, and disaster
            response institutions. Its lessons continue to shape preparedness planning and risk
            reduction efforts across the country.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="08c" label="MEET THE TEAM" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">The People Behind the Portal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-5 shrink-0 overflow-hidden">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-9 h-9 text-muted-foreground/50" />
                )}
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">{member.name}</h3>
              <div className="font-mono text-xs tracking-wide text-primary mt-1 mb-3 space-y-0.5">
                {member.role.split(" | ").map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              {(member.links.linkedin || member.links.github || member.links.instagram) && (
                <div className="flex gap-3 mt-5">
                  {member.links.linkedin && (
                    <a
                      href={member.links.linkedin}
                      aria-label={`${member.name} on LinkedIn`}
                      className="w-8 h-8 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.links.github && (
                    <a
                      href={member.links.github}
                      aria-label={`${member.name} on GitHub`}
                      className="w-8 h-8 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.links.instagram && (
                    <a
                      href={member.links.instagram}
                      aria-label={`${member.name} on Instagram`}
                      className="w-8 h-8 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="08d" label="GET IN TOUCH" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Get in Touch</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="FULL NAME">
                <input
                  name="name"
                  required
                  className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </Field>
              <Field label="EMAIL">
                <input
                  name="email"
                  required
                  type="email"
                  className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </Field>
            </div>
            <Field label="SUBJECT">
              <input
                name="subject"
                className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                placeholder="Research enquiry / Feedback / Partnership"
              />
            </Field>
            <Field label="MESSAGE">
              <textarea
                name="message"
                required
                rows={5}
                className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
                placeholder="Your message..."
              />
            </Field>
            <button
              disabled={status === "sending"}
              className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "sending"
                ? "Sending…"
                : status === "success"
                  ? "Message Sent ✓"
                  : "Send Message"}
            </button>
            {status === "success" && (
              <p className="text-sm text-primary">
                Thanks, your message has been sent. We'll be in touch.
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">
                Something went wrong sending your message. Please try again.
              </p>
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
      <span className="block font-mono text-xs tracking-widest text-muted-foreground mb-2">
        {label}
      </span>
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
