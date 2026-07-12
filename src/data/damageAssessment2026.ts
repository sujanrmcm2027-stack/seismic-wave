export type VerificationStatus = "official" | "media" | "unverified";

export type IncidentPhase = "Foreshock" | "Main Shock" | "Aftershock" | "Aftermath";

export type IncidentCategory =
  | "Structural Failure"
  | "Road Blockage"
  | "Landslide"
  | "Casualty Report"
  | "Displacement";

export type DamageIncident = {
  id: string;
  district: string;
  place: string;
  lat: number;
  lng: number;
  phase: IncidentPhase;
  category: IncidentCategory;
  verification: VerificationStatus;
  source: string;
  headline: string;
  detail: string;
  /** ISO timestamp */
  time: string;
  casualties?: number;
  displaced?: number;
  roadBlocked?: boolean;
};

// Seed dataset for the 2026 damage assessment dashboard. Coordinates are
// approximate district/settlement centroids used as placeholder incident
// locations, not surveyed impact points.
export const DAMAGE_INCIDENTS_2026: DamageIncident[] = [
  {
    id: "da-2026-001",
    district: "Lamjung",
    place: "Besisahar Municipality",
    lat: 28.2317,
    lng: 84.3767,
    phase: "Main Shock",
    category: "Structural Failure",
    verification: "official",
    source: "NDRRMA Situation Report",
    headline: "M5.4 main shock collapses two multi-storey buildings in Besisahar",
    detail:
      "NDRRMA confirms structural collapse of two buildings near the bazaar area. Search and rescue teams deployed from Pokhara.",
    time: "2026-06-02T04:18:00+05:45",
    casualties: 3,
    displaced: 42,
    roadBlocked: false,
  },
  {
    id: "da-2026-002",
    district: "Lamjung",
    place: "Sundarbazar",
    lat: 28.1667,
    lng: 84.45,
    phase: "Aftershock",
    category: "Road Blockage",
    verification: "official",
    source: "MoHA Disaster Portal",
    headline: "Aftershock triggers debris slide, blocks Sundarbazar–Besisahar road",
    detail:
      "District Disaster Management Committee reports the highway blocked by fallen rock and debris.",
    time: "2026-06-02T09:47:00+05:45",
    roadBlocked: true,
  },
  {
    id: "da-2026-003",
    district: "Bajhang",
    place: "Chainpur",
    lat: 29.5433,
    lng: 81.1922,
    phase: "Main Shock",
    category: "Displacement",
    verification: "media",
    source: "Kantipur Daily",
    headline: "Bhukampa leaves dozens of Chainpur families without shelter",
    detail:
      "Kantipur field reporters confirm at least 30 families are sheltering in temporary tents after wall collapses.",
    time: "2026-05-14T21:05:00+05:45",
    displaced: 30,
  },
  {
    id: "da-2026-004",
    district: "Bajhang",
    place: "Bungal",
    lat: 29.65,
    lng: 81.25,
    phase: "Aftermath",
    category: "Structural Failure",
    verification: "unverified",
    source: "X (Twitter): @localwatch_np",
    headline: '"Bhukampa le ghar cracked, walls collapsed near Bungal bazaar"',
    detail:
      "Social media post claims widespread cracked walls; no field team has confirmed the report yet.",
    time: "2026-05-15T07:30:00+05:45",
  },
  {
    id: "da-2026-005",
    district: "Kathmandu",
    place: "Kathmandu Valley, Kalanki",
    lat: 27.6939,
    lng: 85.2799,
    phase: "Aftershock",
    category: "Road Blockage",
    verification: "official",
    source: "NEOC Alert",
    headline: "Overpass inspection closes Kalanki junction after aftershock",
    detail:
      "National Emergency Operation Center closed the Kalanki flyover for structural inspection following a felt aftershock.",
    time: "2026-06-03T13:12:00+05:45",
    roadBlocked: true,
  },
  {
    id: "da-2026-006",
    district: "Bhaktapur",
    place: "Kathmandu Valley, Bhaktapur Durbar Square",
    lat: 27.671,
    lng: 85.4298,
    phase: "Aftermath",
    category: "Structural Failure",
    verification: "media",
    source: "The Kathmandu Post",
    headline: "Heritage-zone masonry cracked in Bhaktapur after recurring aftershocks",
    detail:
      "Reporters observed fresh cracks on heritage structures; the Department of Archaeology has been notified for inspection.",
    time: "2026-06-04T10:40:00+05:45",
  },
  {
    id: "da-2026-007",
    district: "Kathmandu",
    place: "Kathmandu Valley, Balaju",
    lat: 27.7359,
    lng: 85.3084,
    phase: "Aftermath",
    category: "Casualty Report",
    verification: "unverified",
    source: "Facebook: Kathmandu Alerts Group",
    headline: 'Unconfirmed post: "earthquake collapsed building in Balaju, people trapped"',
    detail:
      "Crowd-sourced post circulating widely; NEOC has not yet issued a matching confirmation for this location.",
    time: "2026-06-04T22:58:00+05:45",
  },
  {
    id: "da-2026-008",
    district: "Sindhupalchok",
    place: "Chautara",
    lat: 27.8181,
    lng: 85.6961,
    phase: "Main Shock",
    category: "Landslide",
    verification: "official",
    source: "NDRRMA Situation Report",
    headline: "Landslide following main shock cuts off three Chautara wards",
    detail:
      "Access roads to three wards blocked by a landslide triggered soon after the main shock; helicopter relief requested.",
    time: "2026-04-21T02:33:00+05:45",
    displaced: 65,
    roadBlocked: true,
  },
  {
    id: "da-2026-009",
    district: "Dolakha",
    place: "Charikot",
    lat: 27.6636,
    lng: 86.1751,
    phase: "Foreshock",
    category: "Structural Failure",
    verification: "media",
    source: "Kantipur Daily",
    headline: "Foreshock cracks school building walls ahead of stronger tremor fears",
    detail:
      "Local correspondents report visible cracks at a community school; officials advise classes move outdoors as a precaution.",
    time: "2026-06-01T16:20:00+05:45",
  },
  {
    id: "da-2026-010",
    district: "Jajarkot",
    place: "Khalanga",
    lat: 28.7,
    lng: 82.2,
    phase: "Aftermath",
    category: "Displacement",
    verification: "official",
    source: "MoHA Disaster Portal",
    headline: "Temporary relief camps set up in Khalanga for displaced families",
    detail:
      "Home Ministry confirms three relief camps now operating for families whose homes were declared unsafe.",
    time: "2026-03-11T11:00:00+05:45",
    displaced: 88,
  },
  {
    id: "da-2026-011",
    district: "Doti",
    place: "Dipayal",
    lat: 29.27,
    lng: 80.93,
    phase: "Aftershock",
    category: "Road Blockage",
    verification: "unverified",
    source: "X (Twitter): @farwest_updates",
    headline: '"Aftershock in Dipayal, road cracked near the bridge" (unconfirmed)',
    detail:
      "A single social post mentions a cracked road surface near a river bridge; no government or media source has verified it.",
    time: "2026-06-05T06:14:00+05:45",
  },
  {
    id: "da-2026-012",
    district: "Kathmandu",
    place: "Kathmandu Valley, Patan",
    lat: 27.6644,
    lng: 85.3188,
    phase: "Aftermath",
    category: "Casualty Report",
    verification: "official",
    source: "NEOC Alert",
    headline: "NEOC confirms minor injuries from falling debris in Patan",
    detail:
      "Two minor injuries confirmed by ambulance dispatch records; both patients discharged after treatment.",
    time: "2026-06-06T08:02:00+05:45",
    casualties: 2,
  },
];

// Combinatorial live-feed generator: mixes district × location × damage
// variant × source × verification, so simulated incoming incidents are
// drawn from thousands of unique combinations instead of a small fixed
// template list — a fixed list of even a dozen entries eventually repeats
// verbatim once it cycles through, which read as "the feed looping."
const LIVE_FEED_DISTRICTS: { name: string; lat: number; lng: number }[] = [
  { name: "Gorkha", lat: 28.0, lng: 84.6333 },
  { name: "Lamjung", lat: 28.2317, lng: 84.3767 },
  { name: "Dhading", lat: 27.8667, lng: 84.9167 },
  { name: "Nuwakot", lat: 27.9167, lng: 85.1833 },
  { name: "Sindhupalchok", lat: 27.8181, lng: 85.6961 },
  { name: "Dolakha", lat: 27.6636, lng: 86.1751 },
  { name: "Kathmandu", lat: 27.7172, lng: 85.324 },
  { name: "Bhaktapur", lat: 27.671, lng: 85.4298 },
  { name: "Lalitpur", lat: 27.6588, lng: 85.3247 },
  { name: "Kavrepalanchok", lat: 27.6211, lng: 85.548 },
  { name: "Chitwan", lat: 27.5291, lng: 84.3542 },
  { name: "Makwanpur", lat: 27.4167, lng: 85.0333 },
  { name: "Rasuwa", lat: 28.1075, lng: 85.2999 },
  { name: "Doti", lat: 29.274, lng: 80.935 },
  { name: "Bajhang", lat: 29.546, lng: 81.198 },
  { name: "Jajarkot", lat: 28.7, lng: 82.2 },
];

const LIVE_FEED_LOCATION_SUFFIXES = [
  "near the old bazaar",
  "near the bus park",
  "along the highway bypass",
  "near the ward office",
  "in the community square",
  "near the secondary school",
];

const LIVE_FEED_SOURCES_BY_VERIFICATION: Record<VerificationStatus, string[]> = {
  unverified: [
    "Facebook: District Updates",
    "X (Twitter): @local_tremor_watch",
    "Viber: Community Alert Group",
    "Facebook: Local Samachar",
  ],
  media: ["Kantipur Daily", "The Kathmandu Post", "Setopati"],
  official: ["NDRRMA Situation Report", "MoHA Disaster Portal", "NEOC Alert"],
};

type LiveFeedVariant = {
  phase: IncidentPhase;
  category: IncidentCategory;
  headline: (district: string) => string;
  detail: string;
};

const LIVE_FEED_VARIANTS: LiveFeedVariant[] = [
  {
    phase: "Aftershock",
    category: "Structural Failure",
    headline: (d) => `"${d}: fresh cracks reported on a residential wall"`,
    detail:
      "Local social post claims cosmetic wall separation; awaiting official structural audit.",
  },
  {
    phase: "Aftershock",
    category: "Road Blockage",
    headline: (d) => `"${d}: minor rockfall and debris clearing underway on local route"`,
    detail:
      "Motorist alerts suggest single-lane traffic disruption; checking with local police for updates.",
  },
  {
    phase: "Aftershock",
    category: "Landslide",
    headline: (d) => `"${d}: small slope movement reported above the settlement"`,
    detail: "Residents describe loosened soil after the tremor; no confirmed blockage yet.",
  },
  {
    phase: "Aftermath",
    category: "Displacement",
    headline: (d) => `"${d}: a few households moved outdoors as a precaution"`,
    detail: "Community group chat mentions families sheltering outside pending a structural check.",
  },
  {
    phase: "Aftershock",
    category: "Casualty Report",
    headline: (d) => `"${d}: strong shaking felt, residents gathered in open spaces"`,
    detail:
      "Crowdsourced reports describe brief panic; no injuries or structural damage claimed yet.",
  },
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Weighted toward "unverified" since this pool represents the raw,
// crowd-sourced side of the feed — official/media confirmations are the
// minority, same balance as the seeded 2026 dataset above.
function pickLiveFeedVerification(): VerificationStatus {
  const roll = Math.random();
  if (roll < 0.6) return "unverified";
  if (roll < 0.85) return "media";
  return "official";
}

export function generateLiveIncident(): Omit<DamageIncident, "id" | "time"> {
  const district = pickRandom(LIVE_FEED_DISTRICTS);
  const locationSuffix = pickRandom(LIVE_FEED_LOCATION_SUFFIXES);
  const variant = pickRandom(LIVE_FEED_VARIANTS);
  const verification = pickLiveFeedVerification();
  const source = pickRandom(LIVE_FEED_SOURCES_BY_VERIFICATION[verification]);
  const jitter = () => (Math.random() - 0.5) * 0.05;

  return {
    district: district.name,
    place: `${district.name}, ${locationSuffix}`,
    lat: district.lat + jitter(),
    lng: district.lng + jitter(),
    phase: variant.phase,
    category: variant.category,
    verification,
    source,
    headline: variant.headline(district.name),
    detail: variant.detail,
  };
}
