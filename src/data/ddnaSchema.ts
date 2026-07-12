import { z } from "zod";

// Standardized municipal damage-reporting schema modeled on Nepal's Detailed
// Damage and Needs Assessment (DDNA) format and the BIPAD Portal incident
// schema, as required under the DRRM Act 2074 for local-level reporting
// within 72 hours of a significant seismic event. Field names intentionally
// mirror the national schema so a future direct BIPAD API integration is a
// mapping exercise, not a redesign.
export const DDNA_SCHEMA_VERSION = "DDNA-BIPAD-1.0";

export const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
] as const;

export const LOCAL_LEVEL_TYPES = [
  "Metropolitan City",
  "Sub-Metropolitan City",
  "Municipality",
  "Rural Municipality",
] as const;

// EMS-98-aligned structural damage grading, the classification used by
// DUDBC/NRA post-earthquake survey forms and referenced by NBC 105:2020.
export const DAMAGE_GRADES = [
  { grade: "G1", label: "Grade 1 — Negligible / No Damage" },
  { grade: "G2", label: "Grade 2 — Slight (non-structural cracking)" },
  { grade: "G3", label: "Grade 3 — Moderate (structural cracking)" },
  { grade: "G4", label: "Grade 4 — Substantial (partial collapse risk)" },
  { grade: "G5", label: "Grade 5 — Complete Collapse" },
] as const;

export const IMMEDIATE_NEEDS = [
  "Emergency Shelter",
  "Medical / Trauma Care",
  "Water, Sanitation & Hygiene (WASH)",
  "Food & Nutrition",
  "Search & Rescue",
  "Structural Inspection Teams",
] as const;

export const SYNC_STATUSES = ["draft", "submitted", "ndrrma_reviewed", "bipad_synced"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

const structuralDamageSchema = z.object({
  totalStructuresSurveyed: z.coerce.number().int().min(0),
  grade1Negligible: z.coerce.number().int().min(0).default(0),
  grade2Slight: z.coerce.number().int().min(0).default(0),
  grade3Moderate: z.coerce.number().int().min(0).default(0),
  grade4Substantial: z.coerce.number().int().min(0).default(0),
  grade5Collapse: z.coerce.number().int().min(0).default(0),
});

const humanImpactSchema = z.object({
  deaths: z.coerce.number().int().min(0).default(0),
  injuries: z.coerce.number().int().min(0).default(0),
  missing: z.coerce.number().int().min(0).default(0),
  displacedFamilies: z.coerce.number().int().min(0).default(0),
  displacedIndividuals: z.coerce.number().int().min(0).default(0),
});

const criticalInfrastructureSchema = z.object({
  schoolsDamaged: z.coerce.number().int().min(0).default(0),
  healthFacilitiesDamaged: z.coerce.number().int().min(0).default(0),
  roadsBlockedKm: z.coerce.number().min(0).default(0),
  bridgesDamaged: z.coerce.number().int().min(0).default(0),
  waterSystemsDamaged: z.coerce.number().int().min(0).default(0),
});

// Fields a municipal official fills in on submission. Timestamps, sync
// status, and derived compliance flags are attached server-side.
export const ddnaReportInputSchema = z.object({
  province: z.enum(NEPAL_PROVINCES),
  district: z.string().min(2, "District is required"),
  localLevel: z.string().min(2, "Local level (municipality) name is required"),
  localLevelType: z.enum(LOCAL_LEVEL_TYPES),
  ward: z.coerce.number().int().min(1).max(35),
  eventReference: z
    .string()
    .min(3, "Reference the triggering event (e.g. M5.4 Lamjung 2026-06-02)"),
  eventTimestamp: z.string().min(1, "Event timestamp is required"),
  submittedBy: z.object({
    name: z.string().min(2, "Reporting officer name is required"),
    designation: z.string().min(2, "Designation is required"),
    phone: z.string().min(7, "A reachable phone number is required"),
    email: z.string().email().optional().or(z.literal("")),
  }),
  gps: z
    .object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
    })
    .optional(),
  structuralDamage: structuralDamageSchema,
  humanImpact: humanImpactSchema,
  criticalInfrastructure: criticalInfrastructureSchema,
  immediateNeeds: z.array(z.enum(IMMEDIATE_NEEDS)).default([]),
  narrative: z.string().min(10, "A short narrative summary is required").max(2000),
});

export type DdnaReportInput = z.infer<typeof ddnaReportInputSchema>;

export const ddnaDamageReportSchema = ddnaReportInputSchema.extend({
  id: z.string(),
  schemaVersion: z.literal(DDNA_SCHEMA_VERSION),
  submittedTimestamp: z.string(),
  hoursSinceEvent: z.number(),
  within72Hours: z.boolean(),
  syncStatus: z.enum(SYNC_STATUSES),
});

export type DdnaDamageReport = z.infer<typeof ddnaDamageReportSchema>;

export function computeReportingWindow(eventTimestamp: string, submittedTimestamp: string) {
  const eventMs = new Date(eventTimestamp).getTime();
  const submittedMs = new Date(submittedTimestamp).getTime();
  const hoursSinceEvent = Math.max(0, (submittedMs - eventMs) / (1000 * 60 * 60));
  return { hoursSinceEvent, within72Hours: hoursSinceEvent <= 72 };
}

const CSV_COLUMNS: { header: string; get: (r: DdnaDamageReport) => string | number }[] = [
  { header: "report_id", get: (r) => r.id },
  { header: "schema_version", get: (r) => r.schemaVersion },
  { header: "province", get: (r) => r.province },
  { header: "district", get: (r) => r.district },
  { header: "local_level", get: (r) => r.localLevel },
  { header: "local_level_type", get: (r) => r.localLevelType },
  { header: "ward", get: (r) => r.ward },
  { header: "event_reference", get: (r) => r.eventReference },
  { header: "event_timestamp", get: (r) => r.eventTimestamp },
  { header: "submitted_timestamp", get: (r) => r.submittedTimestamp },
  { header: "hours_since_event", get: (r) => r.hoursSinceEvent.toFixed(1) },
  { header: "within_72_hours", get: (r) => (r.within72Hours ? "yes" : "no") },
  { header: "reporting_officer", get: (r) => r.submittedBy.name },
  { header: "designation", get: (r) => r.submittedBy.designation },
  { header: "phone", get: (r) => r.submittedBy.phone },
  { header: "gps_lat", get: (r) => r.gps?.lat ?? "" },
  { header: "gps_lng", get: (r) => r.gps?.lng ?? "" },
  { header: "structures_surveyed", get: (r) => r.structuralDamage.totalStructuresSurveyed },
  { header: "grade1_negligible", get: (r) => r.structuralDamage.grade1Negligible },
  { header: "grade2_slight", get: (r) => r.structuralDamage.grade2Slight },
  { header: "grade3_moderate", get: (r) => r.structuralDamage.grade3Moderate },
  { header: "grade4_substantial", get: (r) => r.structuralDamage.grade4Substantial },
  { header: "grade5_collapse", get: (r) => r.structuralDamage.grade5Collapse },
  { header: "deaths", get: (r) => r.humanImpact.deaths },
  { header: "injuries", get: (r) => r.humanImpact.injuries },
  { header: "missing", get: (r) => r.humanImpact.missing },
  { header: "displaced_families", get: (r) => r.humanImpact.displacedFamilies },
  { header: "displaced_individuals", get: (r) => r.humanImpact.displacedIndividuals },
  { header: "schools_damaged", get: (r) => r.criticalInfrastructure.schoolsDamaged },
  {
    header: "health_facilities_damaged",
    get: (r) => r.criticalInfrastructure.healthFacilitiesDamaged,
  },
  { header: "roads_blocked_km", get: (r) => r.criticalInfrastructure.roadsBlockedKm },
  { header: "bridges_damaged", get: (r) => r.criticalInfrastructure.bridgesDamaged },
  { header: "water_systems_damaged", get: (r) => r.criticalInfrastructure.waterSystemsDamaged },
  { header: "immediate_needs", get: (r) => r.immediateNeeds.join("; ") },
  { header: "sync_status", get: (r) => r.syncStatus },
  { header: "narrative", get: (r) => r.narrative },
];

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function exportDdnaReportsToCsv(reports: DdnaDamageReport[]): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows = reports.map((r) => CSV_COLUMNS.map((c) => csvEscape(c.get(r))).join(","));
  return [header, ...rows].join("\n");
}

export function exportDdnaReportsToJson(reports: DdnaDamageReport[]): string {
  return JSON.stringify(
    { schemaVersion: DDNA_SCHEMA_VERSION, exportedAt: new Date().toISOString(), reports },
    null,
    2,
  );
}
