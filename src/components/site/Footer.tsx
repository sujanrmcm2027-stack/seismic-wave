import { Link } from "@tanstack/react-router";
import { Activity, Twitter, Github, Instagram, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionLabel } from "@/components/site/SectionLabel";

type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };
type LegalSection = { heading: string; blocks: LegalBlock[] };

const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: "1. Introduction",
    blocks: [
      {
        type: "p",
        text: `This Privacy Policy outlines how the National Earthquake Awareness Portal ("the Portal," "we," "us," or "our") collects, processes, stores, and safeguards data collected from users ("you" or "your"). Operating in alignment with international data protection principles, including GDPR guidelines where applicable, and the legal frameworks of Nepal, we are committed to ensuring public trust while managing critical seismic and crowdsourced emergency data.`,
      },
    ],
  },
  {
    heading: "2. Information We Collect",
    blocks: [
      {
        type: "ul",
        items: [
          "Personally Identifiable Information (PII): Names, email addresses, institutional affiliations, and phone numbers voluntarily provided through contact or reporting forms.",
          "Real-Time Geo-location Data: GPS coordinates collected only with explicit user permission to locate Safe Zones or accurately pin damage reports.",
          "Technical & Usage Data: IP addresses, browser type, operating system, device identifiers, session duration, and diagnostic logs.",
          "Cookies & Browser Storage: Cookies and local browser storage used to improve functionality and performance.",
        ],
      },
    ],
  },
  {
    heading: "3. Purpose of Data Processing",
    blocks: [
      {
        type: "ul",
        items: [
          "Support disaster preparedness and emergency response.",
          "Route crowdsourced structural damage assessments (EMS-98 grading) to authorized authorities.",
          "Support NDRRMA and other emergency agencies.",
          "Improve GIS mapping performance and infrastructure reliability.",
          "Enhance security, analytics, and system monitoring.",
          "Respond to user inquiries.",
        ],
      },
    ],
  },
  {
    heading: "4. Data Sharing and Third-Party Services",
    blocks: [
      {
        type: "p",
        text: "The Portal does not sell, lease, or commercially distribute personal information. Data may only be shared with authorized government emergency agencies when necessary for disaster management. Anonymous or aggregated information may be displayed through mapping technologies such as Leaflet and OpenStreetMap.",
      },
    ],
  },
  {
    heading: "5. Data Retention, Security, and Local Storage",
    blocks: [
      {
        type: "ul",
        items: [
          "Retention: Data may be retained for up to twenty-four (24) months unless longer retention is required by law or disaster management purposes.",
          "Security: HTTPS, SSL/TLS encryption, firewall protection, secure server infrastructure, access controls, and monitoring are implemented.",
          "Local Storage: Certain assessment progress may be cached in browser local storage until synchronization is possible.",
        ],
      },
    ],
  },
];

const TERMS_OF_USE_SECTIONS: LegalSection[] = [
  {
    heading: "1. Acceptance of Terms",
    blocks: [
      {
        type: "p",
        text: "By accessing or using the Portal, you agree to comply with these Terms and all applicable laws of Nepal.",
      },
    ],
  },
  {
    heading: "2. Acceptable Use",
    blocks: [
      {
        type: "p",
        text: "Users must not submit false reports, manipulate assessment data, reverse engineer the platform, scrape data without authorization, upload malicious software, attempt unauthorized access, conduct DDoS attacks, or interfere with emergency communications.",
      },
    ],
  },
  {
    heading: "3. Emergency Information Disclaimer",
    blocks: [
      {
        type: "p",
        text: "Information is provided 'as-is'. Earthquake feeds may contain delays and must never replace official emergency instructions issued by the Government of Nepal.",
      },
    ],
  },
  {
    heading: "4. Information Accuracy",
    blocks: [
      {
        type: "p",
        text: "Although reasonable efforts are made, the Portal cannot guarantee completeness, accuracy, availability, or timeliness of all information.",
      },
    ],
  },
  {
    heading: "5. User Responsibility",
    blocks: [
      {
        type: "p",
        text: "Users remain responsible for verifying emergency information through official government sources before making decisions affecting safety or property.",
      },
    ],
  },
  {
    heading: "6. Suspension of Services",
    blocks: [
      {
        type: "p",
        text: "The Portal may suspend or modify services without prior notice due to maintenance, security incidents, disaster response priorities, or technical failures.",
      },
    ],
  },
  {
    heading: "7. External Links",
    blocks: [
      {
        type: "p",
        text: "The Portal may contain links to third-party organizations and is not responsible for their content or privacy practices.",
      },
    ],
  },
  {
    heading: "8. User-Generated Content",
    blocks: [
      {
        type: "p",
        text: "Reports, photographs, videos, and assessments submitted by users may be used for disaster response, education, research, statistics, and public awareness.",
      },
    ],
  },
  {
    heading: "9. Intellectual Property",
    blocks: [
      {
        type: "p",
        text: "Unless otherwise stated, software, interface designs, graphics, documentation, dashboards, and original content remain the intellectual property of the Portal.",
      },
    ],
  },
  {
    heading: "10. Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "To the fullest extent permitted by law, neither the Portal nor affiliated agencies shall be liable for damages arising from use of or inability to use the Portal.",
      },
    ],
  },
];

const ACCESSIBILITY_STATEMENT_SECTIONS: LegalSection[] = [
  {
    heading: "1. Commitment to Inclusive Access",
    blocks: [
      {
        type: "p",
        text: "The National Earthquake Awareness Portal is committed to ensuring that life-saving emergency information is accessible to all individuals, regardless of their physical, sensory, cognitive, or technological limitations. We believe that every user should be able to access critical earthquake preparedness resources, emergency alerts, safety guidelines, and damage reporting services without unnecessary barriers.",
      },
      {
        type: "p",
        text: "The Portal is designed and continuously improved in accordance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA to promote an inclusive, user-friendly, and equitable digital experience across a wide range of devices and assistive technologies.",
      },
    ],
  },
  {
    heading: "2. Implemented Accessibility Features",
    blocks: [
      {
        type: "p",
        text: "To maximize usability and accessibility, the Portal incorporates several accessibility-focused design and development practices, including:",
      },
      {
        type: "ul",
        items: [
          "Screen Reader Compatibility: Semantic HTML structure, ARIA (Accessible Rich Internet Applications) labels, descriptive headings, and alternative text for images and map markers to support users relying on screen readers.",
          "Keyboard Navigation: All menus, buttons, forms, and interactive elements are fully navigable using standard keyboard controls without requiring a mouse.",
          "Accessible Forms: Form fields include descriptive labels, validation messages, and logical navigation to improve usability for users utilizing assistive technologies.",
          "Responsive Design: The Portal automatically adapts to desktops, tablets, and mobile devices while maintaining readability and usability.",
          "Color and Contrast: Text and interface components maintain a minimum contrast ratio of 4.5:1, supporting users with low vision or color vision deficiencies.",
          "Resizable Text: Users may enlarge browser text without significantly affecting layout or functionality.",
          "Pause Controls: Live scrolling advisories and dynamic notifications can be paused to allow sufficient reading time for users with cognitive or visual impairments.",
          "Consistent Navigation: Navigation menus, buttons, and page layouts remain consistent throughout the Portal to improve usability and reduce confusion.",
          "Accessible Maps: Where possible, interactive maps are supplemented with descriptive information or alternative textual content for improved accessibility.",
        ],
      },
    ],
  },
  {
    heading: "3. Known Limitations",
    blocks: [
      {
        type: "p",
        text: "While every effort is made to ensure accessibility across the Portal, certain advanced GIS visualizations, real-time seismic monitoring dashboards, and interactive mapping components may present limitations when used with older browsers or legacy assistive technologies.",
      },
      {
        type: "p",
        text: "Because live geospatial data changes continuously, some interactive visualizations may not be fully compatible with every screen reader. The Portal is actively working to provide alternative text-based summaries, tabular datasets, and simplified interfaces wherever practical.",
      },
    ],
  },
  {
    heading: "4. Browser Compatibility",
    blocks: [
      {
        type: "p",
        text: "The Portal is optimized for modern web browsers and current mobile operating systems, including the latest versions of Chrome, Firefox, Microsoft Edge, Safari, and other standards-compliant browsers.",
      },
      {
        type: "p",
        text: "Although the Portal may remain functional on older browsers, certain accessibility features and interactive components may not perform as intended. Users are encouraged to keep their browsers and assistive technologies updated for the best experience.",
      },
    ],
  },
  {
    heading: "5. Continuous Improvement",
    blocks: [
      {
        type: "p",
        text: "Accessibility is an ongoing commitment rather than a one-time implementation. The Portal undergoes regular accessibility reviews, usability testing, and technical audits to identify and address potential barriers.",
      },
      {
        type: "p",
        text: "Feedback from users, evolving accessibility standards, and technological advancements are continuously incorporated into future updates to improve usability for all members of the public.",
      },
    ],
  },
  {
    heading: "6. Alternative Information Access",
    blocks: [
      {
        type: "p",
        text: "During emergencies or when digital accessibility barriers exist, important earthquake information may also be disseminated through alternative communication channels, including:",
      },
      {
        type: "ul",
        items: [
          "Government radio broadcasts",
          "SMS and mobile emergency alerts",
          "Television announcements",
          "Local government offices",
          "Community emergency response teams",
          "Public information centers",
          "Official disaster management authorities",
        ],
      },
      {
        type: "p",
        text: "These alternative channels help ensure that critical safety information remains available even during infrastructure disruptions or internet outages.",
      },
    ],
  },
  {
    heading: "7. Feedback",
    blocks: [
      {
        type: "p",
        text: "The National Earthquake Awareness Portal welcomes feedback regarding accessibility and usability. Users who encounter accessibility barriers or experience difficulty using any feature of the Portal are encouraged to report the issue through the Portal's official communication channels once they become available.",
      },
      {
        type: "p",
        text: "Feedback received will be reviewed and considered during future accessibility improvements, with the goal of continuously enhancing the Portal's inclusiveness, reliability, and ease of use for all users.",
      },
    ],
  },
];

function LegalDialog({
  triggerLabel,
  number,
  label,
  title,
  description,
  sections,
}: {
  triggerLabel: string;
  number: string;
  label: string;
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="hover:text-primary transition cursor-pointer">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <SectionLabel number={number} label={label} />
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm text-foreground/85 leading-relaxed text-left">
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="font-semibold text-primary mb-2">{section.heading}</h3>
              <div className="space-y-3">
                {section.blocks.map((block, i) =>
                  block.type === "p" ? (
                    <p key={i}>{block.text}</p>
                  ) : (
                    <ul key={i} className="list-disc pl-5 space-y-1.5">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const contacts: [string, string[]][] = [
  ["Nepal Police", ["100"]],
  ["Fire Brigade", ["101"]],
  ["Ambulance", ["102"]],
  ["DEOC (MoHA)", ["1234"]],
  ["NEOC (MoHA)", ["1149"]],
  ["DHM Flood Desk", ["1155"]],
  ["APF Disaster Management", ["1114"]],
  ["NRCS Emergency Center", ["1130"]],
  ["Red Cross Nepal", ["01-4270650"]],
  ["NDRRMA Main Office", ["01-4211535", "01-4211197", "01-4211553"]],
  ["NDRRMA Focal Info Officer", ["9851320269"]],
  ["MoHA Disaster & Conflict Division", ["01-4200105", "01-4200258"]],
  ["MoHA DRR Section", ["9851166778"]],
  ["MoHA Relief & Data Management", ["01-4211258", "9851218858"]],
  ["HEOC Main Desk", ["01-4262268"]],
];

const pages = [
  { to: "/", label: "Home" },
  { to: "/historical", label: "Historical Earthquakes" },
  { to: "/gis", label: "GIS" },
  { to: "/preparedness", label: "Preparedness" },
  { to: "/test-yourself", label: "Self Assessment" },
  { to: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] pb-12 border-b border-border/60">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-lg bg-primary grid place-items-center shrink-0">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </span>
              <div>
                <div className="font-serif text-lg font-bold text-foreground">Nepal Seismic Portal</div>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  A national resource for earthquake awareness, preparedness, and resilience in Nepal.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-9 h-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">PAGES</div>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-foreground">
              {pages.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="transition-colors hover:text-primary">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-5">EMERGENCY CONTACTS</div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {contacts.map(([name, numbers]) => (
              <div
                key={name}
                className="flex flex-col gap-2 p-3.5 rounded-lg border border-border/50 bg-muted/5 hover:border-primary/40 hover:bg-muted/10 transition"
              >
                <div className="text-xs text-muted-foreground leading-snug">{name}</div>
                <div className="flex flex-col gap-1">
                  {numbers.map((number) => (
                    <a
                      key={number}
                      href={`tel:${number.replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {number}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-[1280px] mx-auto px-8 py-5 flex flex-col md:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <p>© 2026 Nepal Seismic Awareness Portal. All rights reserved.</p>
          <div className="flex gap-5">
            <LegalDialog
              triggerLabel="Privacy Policy"
              number="LEGAL-01"
              label="PRIVACY POLICY"
              title="Privacy Policy"
              description="How the National Earthquake Awareness Portal collects, uses, and protects your data."
              sections={PRIVACY_POLICY_SECTIONS}
            />
            <LegalDialog
              triggerLabel="Terms of Use"
              number="LEGAL-02"
              label="TERMS OF USE"
              title="Terms of Use"
              description="The terms governing your access to and use of the Portal."
              sections={TERMS_OF_USE_SECTIONS}
            />
            <LegalDialog
              triggerLabel="Accessibility Statement"
              number="LEGAL-03"
              label="ACCESSIBILITY STATEMENT"
              title="Accessibility Statement"
              description="Our commitment to inclusive, WCAG 2.1 AA-aligned access to critical earthquake information."
              sections={ACCESSIBILITY_STATEMENT_SECTIONS}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
