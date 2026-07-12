import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download } from "lucide-react";
import { downloadKitChecklistPdf } from "@/lib/pdf/kitChecklistPdf";
import { preloadJsPdf } from "@/lib/pdf/preload";

const KIT_ITEMS = [
  "Drinking water (3L per person per day)",
  "Non-perishable food (3-day supply)",
  "Battery / hand-crank radio",
  "Flashlight + spare batteries",
  "First aid kit + medications",
  "Whistle to signal for help",
  "Dust mask, plastic sheeting, duct tape",
  "Wrench / pliers to turn off utilities",
  "Manual can opener",
  "Local maps and contact list",
  "Mobile phone with backup charger",
  "Cash in small denominations",
  "Copies of documents (sealed bag)",
  "Sturdy shoes, gloves, warm clothing",
  "Sleeping bag / blanket per person",
  "Personal hygiene + sanitation",
  "Important medical equipment",
  "Helmet (especially for children)",
];

export const Route = createFileRoute("/preparedness")({
  head: () => ({
    meta: [
      { title: "Preparedness: Nepal Seismic" },
      {
        name: "description",
        content:
          "Evidence-based earthquake guidance for every phase: before, during, after, adapted to Nepal's communities.",
      },
    ],
  }),
  component: Preparedness,
});

const phases = {
  Before: {
    title: "Before an Earthquake",
    items: [
      [
        "Create a Family Emergency Plan",
        "Establish a meeting point, assign roles, and identify two evacuation routes. Share the plan with every household member, including children.",
      ],
      [
        "Prepare an Emergency Kit",
        "Stock 72 hours of water (3L/person/day), non-perishable food, first aid kit, torch, batteries, radio, copies of documents, medications, and cash in small denominations.",
      ],
      [
        "Secure Your Home",
        "Anchor bookshelves, water heaters, and large appliances to walls. Move heavy items to lower shelves. Identify safe spots under sturdy tables in each room.",
      ],
      [
        "Know Your Building",
        "Verify your building meets Nepal's National Building Code (NBC 2020). If in doubt, consult a licensed structural engineer for a rapid seismic assessment.",
      ],
      [
        "Practice Earthquake Drills",
        "Run Drop, Cover, Hold On drills at home at least twice a year. Ensure all family members know what to do instantly. Panic costs lives.",
      ],
      [
        "Learn Emergency Contacts",
        "Memorise or post key numbers: Police 100, Fire 101, Ambulance 102, National Emergency 1149, and your local municipality's emergency office.",
      ],
    ],
  },
  During: {
    title: "During an Earthquake",
    items: [
      [
        "DROP, COVER, HOLD ON",
        "Drop to hands and knees. Take cover under a sturdy table or desk, or against an interior wall away from windows. Hold on until shaking stops completely.",
      ],
      [
        "If Indoors: Stay Inside",
        "Do not run outside during shaking. Most injuries occur from falling debris near doorways or when fleeing. Protect your head and neck.",
      ],
      [
        "If Outdoors: Move to Open Ground",
        "Move away from buildings, streetlamps, and overhead power lines. Once in the open, drop and stay until shaking stops.",
      ],
      [
        "If in a Vehicle",
        "Pull over away from buildings and trees. Stay inside. Avoid overpasses and bridges. Proceed carefully after shaking stops, watching for road damage.",
      ],
      [
        "If in a Crowd or School",
        "Follow the Drop, Cover, Hold On procedure immediately. Teachers should guide students under desks or against interior walls, then evacuate to the assembly area.",
      ],
      [
        "Do Not Use Elevators",
        "Never use elevators during or after an earthquake. Stairs only, and move calmly to avoid crushing in panicked crowds.",
      ],
    ],
  },
  After: {
    title: "After an Earthquake",
    items: [
      [
        "Expect Aftershocks",
        "Strong aftershocks may follow minutes to weeks after the main event. Be prepared to Drop, Cover, Hold On again. Do not re-enter damaged buildings between aftershocks.",
      ],
      [
        "Check for Injuries and Hazards",
        "Attend to injuries using your first aid kit. Check for gas leaks (smell), electrical damage, structural cracks, and water line breaks before re-entering.",
      ],
      [
        "Evacuate Damaged Structures",
        "Leave any building that smells of gas, has visible structural damage, or where you hear creaking or popping sounds. Do not return until cleared by authorities.",
      ],
      [
        "Use Emergency Communication Plan",
        "Contact your out-of-area emergency contact. SMS and data are more reliable than voice calls when networks are overloaded. Use social media responsibly.",
      ],
      [
        "Listen to Official Information",
        "Monitor Nepal Television, Radio Nepal, and NDRRMA alerts for official information. Avoid spreading unverified information that causes panic.",
      ],
      [
        "Support Community Recovery",
        "Check on neighbours, especially elderly people, persons with disabilities, and those living alone. Community mutual aid accelerates recovery.",
      ],
    ],
  },
} as const;

const groups = {
  "General Public": null,
  Children: [
    [
      "Teach Drop, Cover, Hold On at Home",
      "Practice the drill as a game. Make it routine so children respond instinctively. Use child-friendly language: 'Turtle position.'",
    ],
    [
      "Know Your School's Drill Policy",
      "Ensure your child's school conducts regular earthquake drills. Children who have practised respond up to 40% faster than those who have not.",
    ],
    [
      "Reassure and Prepare Emotionally",
      "Children experience fear and confusion. Reassure them honestly, involve them in planning, and designate a trusted adult outside the home for them to contact.",
    ],
    [
      "Helmet and Shoes by the Bed",
      "A simple helmet and closed shoes kept by children's beds dramatically reduce head and foot injuries during nighttime earthquakes.",
    ],
  ],
  Elderly: [
    [
      "Mobility-Specific Evacuation Plan",
      "Map exit routes that account for limited mobility. Identify helpers (neighbours, relatives) designated to assist during evacuation.",
    ],
    [
      "Medication and Medical Equipment",
      "Keep a 7-day supply of prescription medications, hearing aids, glasses, and mobility aids in the emergency kit. Register with local health authorities as a high-dependency person.",
    ],
    [
      "Accessibility-First Safe Spots",
      "Identify safe spots that are reachable without climbing or running. A ground-floor interior room is often ideal.",
    ],
    [
      "Register with Local Authorities",
      "Nepal's local wards maintain lists of elderly and mobility-impaired residents for priority rescue. Register proactively with your ward office.",
    ],
  ],
  "Persons With Disabilities": [
    [
      "Personal Emergency Evacuation Plan (PEEP)",
      "Develop a written PEEP that identifies your needs, assigned helpers, equipment, and communication methods during an emergency.",
    ],
    [
      "Accessible Evacuation Routes",
      "Identify routes that are wheelchair-accessible or usable with your specific mobility aid. Test them before an emergency.",
    ],
    [
      "Medical Alert Information",
      "Wear or carry a medical alert card or device that informs responders of your needs, medications, and emergency contacts.",
    ],
    [
      "Communicate Needs to Neighbours",
      "Brief trusted neighbours on how to assist you during evacuation. Mutual knowledge saves critical minutes in a real emergency.",
    ],
  ],
  "Remote Communities": [
    [
      "Community-Based Preparedness",
      "Form a village-level disaster management committee. Assign roles (search-and-rescue, first aid, communication) before any earthquake occurs.",
    ],
    [
      "Low-Cost Structural Mitigation",
      "Retrofit stone-and-mud construction with horizontal belt beams and corner-joint reinforcement, low-cost interventions proven to prevent pancake collapse.",
    ],
    [
      "Community Emergency Cache",
      "Maintain a communal stock of first aid supplies, rope, basic tools, and enough food for 3 days. Keep it in a structurally sound community building.",
    ],
    [
      "Satellite Communication",
      "Many remote wards have no mobile coverage. NDRRMA and Red Cross have distributed satellite phones to select wards. Identify your nearest satellite communication point.",
    ],
  ],
} as const;

function Preparedness() {
  const [phase, setPhase] = useState<keyof typeof phases>("Before");
  const [group, setGroup] = useState<keyof typeof groups>("General Public");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const packedCount = KIT_ITEMS.filter((i) => checked[i]).length;
  const toggleItem = (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  useEffect(() => {
    preloadJsPdf();
  }, []);

  const downloadPdf = async () => {
    try {
      await downloadKitChecklistPdf(KIT_ITEMS, checked);
      toast.success("Emergency kit checklist PDF downloaded");
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    }
  };

  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <SectionLabel number="06" label="PREPAREDNESS" />
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">
            Earthquake Safety and Preparedness
          </h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Evidence-based guidance for every phase of an earthquake: before, during, and after.
            Adapted for Nepal's diverse communities and geographic contexts.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="inline-flex bg-surface border border-border rounded-lg p-1 mb-10">
          {(Object.keys(phases) as Array<keyof typeof phases>).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${phase === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">{phases[phase].title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {phases[phase].items.map(([t, d], i) => (
            <div key={t} className="bg-surface border border-border rounded-lg p-6">
              <div className="font-serif text-3xl text-primary/70 mb-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-bold text-lg mb-3 text-foreground">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="06b" label="SPECIAL GUIDANCE" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">
          Preparedness for Every Community
        </h2>
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(groups) as Array<keyof typeof groups>).map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`px-5 py-2.5 rounded-md text-sm font-medium border transition ${group === g ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {g}
            </button>
          ))}
        </div>
        {groups[group] === null ? (
          <div className="bg-surface border border-border rounded-lg p-8">
            <p className="text-muted-foreground">
              Select a specific group above for tailored guidance. General preparedness steps are
              shown in the Before / During / After sections above.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {groups[group]!.map(([t, d]) => (
              <div key={t} className="bg-surface border border-border rounded-lg p-6 flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground mb-2">{t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionLabel number="06c" label="CHECKLIST" />
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              72-Hour Emergency Kit
            </h2>
            <p className="text-sm text-muted-foreground">
              {packedCount} / {KIT_ITEMS.length} items packed · aligned with NDRRMA, Sphere
              Standards, and WHO/PAHO household kit guidance
            </p>
          </div>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Download PDF (watermarked)
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {KIT_ITEMS.map((i) => (
            <label
              key={i}
              className="flex items-center gap-3 bg-surface border border-border rounded-md px-4 py-3 cursor-pointer hover:border-primary/40"
            >
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => toggleItem(i)}
                className="w-4 h-4 accent-[color:var(--color-primary)]"
              />
              <span className="text-sm text-foreground/85">{i}</span>
            </label>
          ))}
        </div>
      </section>
    </Layout>
  );
}
