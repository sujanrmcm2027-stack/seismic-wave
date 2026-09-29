/**
 * test_sheets_sync.ts
 * Tests posting live records to the newly deployed Google Sheet Web App.
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZi57OKGGzVNSePQMDKlDvDhTQHM-ouf0KEH2C3NuHIH7wYjTQzSkzwdXrAE7Cfle3bw/exec";

async function testSync() {
  console.log("Testing sync to:", GOOGLE_SCRIPT_URL);

  // 1. Post Seismic Tremor Log
  const eqPayload = {
    action: "eq_log",
    events: [
      {
        eventId: "test_event_2026_01",
        originTimeNpt: "2026-09-30 00:55:00 NPT",
        magnitude: 5.2,
        magnitudeType: "Mw",
        depthKm: 12.0,
        placeName: "Mustang, Nepal",
        latitude: 28.98,
        longitude: 83.85,
        reportingAgencies: ["NEMRC", "CENC", "USGS"],
        agreementLevel: "HIGH",
        sourceUrl: "https://seismonepal.gov.np",
      },
    ],
  };

  const res1 = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(eqPayload),
  });
  console.log("1. Seismic Tremor Sync response:", await res1.text());

  // 2. Post Road Disruption Log
  const roadPayload = {
    action: "road_log",
    items: [
      {
        highwayCode: "NH01",
        name: "NH01 – Mahendra Rajmarg",
        nameNe: "महेन्द्र राजमार्ग",
        status: "partial",
        detail: "Heavy Rainfall at Binayee Tribeni-2, Nawalparasi East",
        lastUpdated: "2026-09-30 00:55:00 NPT",
      },
      {
        highwayCode: "NH42",
        name: "NH42 – Prithvi Hwy",
        nameNe: "पृथ्वी राजमार्ग",
        status: "partial",
        detail: "Slow moving at Malekhu due to debris",
        lastUpdated: "2026-09-30 00:55:00 NPT",
      },
    ],
  };

  const res2 = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(roadPayload),
  });
  console.log("2. Road Disruption Sync response:", await res2.text());

  // 3. Post Citizen Help / Safety Status
  const statusPayload = {
    action: "status",
    status: "help",
    name: "Sujan Test User",
    location: "Kathmandu Valley",
    note: "System test: verifying automated cloud & Google Sheets pipeline.",
    userId: "test_user_001",
  };

  const res3 = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(statusPayload),
  });
  console.log("3. Citizen Status Sync response:", await res3.text());

  console.log("\nALL TESTS COMPLETED! Check your Google Sheet tabs now.");
}

testSync().catch(console.error);
