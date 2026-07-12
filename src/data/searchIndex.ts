// Static client-side search index for the header search box. There is no
// backend or content API in this project (see CLAUDE.md), so entries are a
// curated list of the site's actual routes — deep-linking to in-page anchors
// (e.g. a specific historical earthquake tab) isn't possible since those
// pages hold selection state in React, not the URL.
export type SearchEntry = {
  title: string;
  description: string;
  to: string;
  keywords?: string[];
};

export const SEARCH_INDEX: SearchEntry[] = [
  {
    title: "Dashboard",
    description: "Live seismic monitor, earthquake science, and Nepal risk data.",
    to: "/",
    keywords: ["home", "science", "mechanism", "geology", "risk projection", "statistics"],
  },
  {
    title: "Historical Earthquakes",
    description: "Case studies of the 1934 Bihar/Nepal, 2015 Gorkha, and 2023 Jajarkot earthquakes.",
    to: "/historical",
    keywords: ["gorkha", "jajarkot", "bihar", "1934", "2015", "2023", "case study", "comparison"],
  },
  {
    title: "GIS Mapping",
    description: "Interactive seismic hazard map with live worldwide earthquake data.",
    to: "/gis",
    keywords: ["map", "hazard", "gis", "spatial planning"],
  },
  {
    title: "Damage Assessment",
    description: "Live 2026 damage tracking, DDNA/BIPAD reporting, and DRR compliance.",
    to: "/damage-assessment",
    keywords: ["ddna", "bipad", "compliance", "incidents", "2026", "sendai", "rumor filter"],
  },
  {
    title: "Safe Zones",
    description: "Nearest safe evacuation spaces across Nepal with live GPS distance.",
    to: "/safe-zones",
    keywords: ["evacuation", "shelter", "open space", "kathmandu valley"],
  },
  {
    title: "Preparedness",
    description: "Before/during/after guidance, special group guidance, and the 72-hour kit checklist.",
    to: "/preparedness",
    keywords: [
      "drop cover hold on",
      "emergency kit",
      "checklist",
      "children",
      "elderly",
      "disabilities",
      "remote communities",
    ],
  },
  {
    title: "Self-Assessment",
    description: "20-question earthquake preparedness assessment with personalised results.",
    to: "/test-yourself",
    keywords: ["quiz", "test", "assessment"],
  },
  {
    title: "About",
    description: "Mission, rationale, team, and how to get in touch.",
    to: "/about",
    keywords: ["team", "contact", "mission", "vision", "rationale"],
  },
];

export function searchIndex(query: string, limit = 6): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.keywords?.some((k) => k.toLowerCase().includes(q)),
  ).slice(0, limit);
}
