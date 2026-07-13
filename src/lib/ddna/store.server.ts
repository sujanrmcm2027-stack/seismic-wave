import {
  computeReportingWindow,
  DDNA_SCHEMA_VERSION,
  type DdnaDamageReport,
  type DdnaReportInput,
} from "@/data/ddnaSchema";

// Process-memory store standing in for a real BIPAD-synced database. Data
// resets on server restart — swap this module for a real persistence layer
// (Postgres/Supabase) without touching callers, since submitDdnaReport /
// listDdnaReports in serverFns.ts are the only consumers.
const reports: DdnaDamageReport[] = [
  {
    id: "ddna-seed-001",
    schemaVersion: DDNA_SCHEMA_VERSION,
    province: "Gandaki",
    district: "Lamjung",
    localLevel: "Besisahar",
    localLevelType: "Municipality",
    ward: 4,
    eventReference: "M5.4 Lamjung Main Shock 2026-06-02",
    eventTimestamp: "2026-06-02T04:18:00+05:45",
    submittedTimestamp: "2026-06-03T11:40:00+05:45",
    hoursSinceEvent: 31.4,
    within72Hours: true,
    submittedBy: {
      name: "Suman Gurung",
      designation: "Ward Disaster Focal Person",
      phone: "+977-9846000001",
      email: "",
    },
    gps: { lat: 28.2317, lng: 84.3767 },
    structuralDamage: {
      totalStructuresSurveyed: 86,
      grade1Negligible: 40,
      grade2Slight: 22,
      grade3Moderate: 14,
      grade4Substantial: 8,
      grade5Collapse: 2,
    },
    humanImpact: {
      deaths: 3,
      injuries: 11,
      missing: 0,
      displacedFamilies: 14,
      displacedIndividuals: 42,
    },
    criticalInfrastructure: {
      schoolsDamaged: 1,
      healthFacilitiesDamaged: 0,
      roadsBlockedKm: 2.5,
      bridgesDamaged: 0,
      waterSystemsDamaged: 1,
    },
    immediateNeeds: ["Emergency Shelter", "Structural Inspection Teams"],
    narrative:
      "Two multi-storey buildings near the bazaar suffered partial collapse. Search and rescue completed; structural inspection ongoing for adjacent structures.",
    syncStatus: "ndrrma_reviewed",
  },
];

export function listReportsServer(): DdnaDamageReport[] {
  return [...reports].sort(
    (a, b) => new Date(b.submittedTimestamp).getTime() - new Date(a.submittedTimestamp).getTime(),
  );
}

export async function addReportServer(input: DdnaReportInput): Promise<DdnaDamageReport> {
  const submittedTimestamp = new Date().toISOString();
  const { hoursSinceEvent, within72Hours } = computeReportingWindow(
    input.eventTimestamp,
    submittedTimestamp,
  );

  const report: DdnaDamageReport = {
    ...input,
    id: `ddna-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    schemaVersion: DDNA_SCHEMA_VERSION,
    submittedTimestamp,
    hoursSinceEvent,
    within72Hours,
    syncStatus: "submitted",
  };

  reports.unshift(report);

  // Send data to Google Apps Script Database if configured
  const scriptUrl = process.env.VITE_GOOGLE_APPS_SCRIPT_URL || (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (scriptUrl) {
    try {
      await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        // We use JSON.stringify twice if we're dealing with strict CORS, 
        // but simple JSON is fine since the Apps Script uses JSON.parse(e.postData.contents).
        // Apps Script prefers text/plain to avoid CORS preflight, so we stringify.
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error("Failed to sync DDNA report to Google Sheets:", error);
    }
  }

  return report;
}
