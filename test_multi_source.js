/**
 * test_multi_source.js — Multi-Source Earthquake Intelligence Verification Suite
 * ==============================================================================
 * Validates Section 26 test requirements:
 * 1. All 3 source records remain visible.
 * 2. Magnitude types (ML, mb, Ms, Mw) remain visible and distinct.
 * 3. Events from disparate agencies are correctly matched using spatial-temporal criteria.
 * 4. Original values are never overwritten or silently normalized.
 * 5. Combined assessment is clearly separated and labeled "Multi-Source Assessment".
 * 6. Source agreement level (HIGH, MODERATE, LOW, INSUFFICIENT) is calculated.
 * 7. Missing source handling works gracefully (1 or 2 sources offline/absent).
 * 8. Revisions do not destroy historical records.
 * 9. Map data contains distinct source locations.
 * 10. Source links are official and traceable.
 */

import { HISTORICAL_BENCHMARK_GROUPS } from "./src/lib/seismic/historicalBenchmarks.ts";
import { evaluateEventPairMatch } from "./src/lib/seismic/eventMatcher.ts";
import { generateMultiSourceAssessment } from "./src/lib/seismic/assessmentEngine.ts";
import { areMagnitudeScalesComparable, evaluateMagnitudeConsistency } from "./src/lib/seismic/magnitudeUtils.ts";

console.log("=====================================================================");
console.log("RUNNING MULTI-SOURCE NEPAL EARTHQUAKE INTELLIGENCE TEST SUITE");
console.log("=====================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

// ── TEST 1: Benchmark Dataset & 3-Source Visibility ────────────────────────
console.log("--- TEST 1: Visibility of All 3 Reporting Agencies ---");
const mustangEvent = HISTORICAL_BENCHMARK_GROUPS.find((g) => g.eventGroupId === "eq_20260908_1608_291N840E");
assert(!!mustangEvent, "2026 Mustang benchmark event exists in historical database");

assert(!!mustangEvent.observations.NEMRC, "NEMRC observation is present and visible");
assert(!!mustangEvent.observations.USGS, "USGS observation is present and visible");
assert(!!mustangEvent.observations.CENC, "CENC observation is present and visible");

// ── TEST 2: Magnitude Scales & Types Preserved ─────────────────────────────
console.log("\n--- TEST 2: Distinct Magnitude Types Preserved ---");
const nemrcObs = mustangEvent.observations.NEMRC;
const usgsObs = mustangEvent.observations.USGS;
const cencObs = mustangEvent.observations.CENC;

assert(nemrcObs.magnitudeType === "ML", "NEMRC preserves local Richter scale (ML)", `Got: ${nemrcObs.magnitudeType}`);
assert(usgsObs.magnitudeType === "mb", "USGS preserves body wave scale (mb)", `Got: ${usgsObs.magnitudeType}`);
assert(cencObs.magnitudeType === "Ms", "CENC preserves surface wave scale (Ms)", `Got: ${cencObs.magnitudeType}`);

assert(nemrcObs.magnitudeValue === 5.3, "NEMRC magnitude (5.3) is preserved exactly");
assert(usgsObs.magnitudeValue === 4.9, "USGS magnitude (4.9) is preserved exactly");
assert(cencObs.magnitudeValue === 5.2, "CENC magnitude (5.2) is preserved exactly");

// ── TEST 3: Multi-Criteria Event Correlation & Matching ───────────────────
console.log("\n--- TEST 3: Multi-Criteria Event Matching Layer ---");
const matchUSGS_NEMRC = evaluateEventPairMatch(nemrcObs, usgsObs);
assert(matchUSGS_NEMRC.matches, "NEMRC and USGS are successfully correlated as the same event");
assert(matchUSGS_NEMRC.distanceKm < 15, `Epicentral distance is within tight margin (${matchUSGS_NEMRC.distanceKm} km)`);
assert(matchUSGS_NEMRC.timeDeltaSec < 5, `Origin time delta is within seconds (${matchUSGS_NEMRC.timeDeltaSec}s)`);

const matchNEMRC_CENC = evaluateEventPairMatch(nemrcObs, cencObs);
assert(matchNEMRC_CENC.matches, "NEMRC and CENC are successfully correlated");
assert(matchNEMRC_CENC.distanceKm < 15, `Epicentral distance between NEMRC and CENC is ${matchNEMRC_CENC.distanceKm} km`);

// Ensure different physical events are NOT falsely matched
const jajarkotEvent = HISTORICAL_BENCHMARK_GROUPS.find((g) => g.eventGroupId === "eq_20231103_1802_288N822E");
const falseMatch = evaluateEventPairMatch(nemrcObs, jajarkotEvent.observations.USGS);
assert(!falseMatch.matches, "Disparate physical events separated by time and space are correctly rejected");

// ── TEST 4: Magnitude Incompatibility & Educational Labeling ──────────────
console.log("\n--- TEST 4: Magnitude Scale Handling & Flagging ---");
assert(!areMagnitudeScalesComparable("ML", "mb"), "ML and mb are flagged as distinct physical scales");
assert(!areMagnitudeScalesComparable("ML", "Ms"), "ML and Ms are flagged as distinct physical scales");

const consistencyCheck = evaluateMagnitudeConsistency([
  { magnitude: nemrcObs.magnitudeValue, magType: nemrcObs.magnitudeType, source: "NEMRC" },
  { magnitude: usgsObs.magnitudeValue, magType: usgsObs.magnitudeType, source: "USGS" },
  { magnitude: cencObs.magnitudeValue, magType: cencObs.magnitudeType, source: "CENC" },
]);
assert(!consistencyCheck.areDirectlyComparable, "Different scales flagged as not directly equivalent");
assert(consistencyCheck.displayText.includes("Different magnitude scales reported"), "Displays 'Different magnitude scales reported'");

// ── TEST 5: Derived Multi-Source Assessment vs Official Values ─────────────
console.log("\n--- TEST 5: Derived Multi-Source Assessment Separation ---");
const assessment = mustangEvent.assessment;
assert(assessment.representativeMagnitude > 0, `Representative magnitude calculated (~${assessment.representativeMagnitude})`);
assert(assessment.disclaimer.includes("does not replace official values"), "Mandatory transparency disclaimer present");
assert(assessment.sourceCount === 3, "Source coverage shows 3 of 3 agencies reporting");
assert(assessment.sourcesReporting.includes("NEMRC") && assessment.sourcesReporting.includes("USGS") && assessment.sourcesReporting.includes("CENC"), "All 3 reporting sources recorded in assessment");

// ── TEST 6: Source Agreement Calculation ──────────────────────────────────
console.log("\n--- TEST 6: Source Agreement Level Calculation ---");
assert(assessment.agreementLevel === "HIGH", `Source agreement level is HIGH for tightly clustered Mustang event (Got: ${assessment.agreementLevel})`);
assert(assessment.spatialAgreement.rating === "HIGH", `Spatial agreement is HIGH (${assessment.spatialAgreement.maxDistanceKm} km)`);
assert(assessment.temporalAgreement.rating === "HIGH", `Temporal agreement is HIGH (Δ ${assessment.temporalAgreement.maxDeltaSec}s)`);

// ── TEST 7: Graceful Missing Source & Single-Source Degradation ────────────
console.log("\n--- TEST 7: Missing Source / Single Source Degradation ---");
const singleGroup = generateMultiSourceAssessment({
  eventGroupId: "test_single_source",
  observations: {
    USGS: usgsObs,
  },
  matchedObservations: [usgsObs],
  reasons: ["Single USGS observation"],
});
assert(singleGroup.assessment.sourceCount === 1, "Single source group correctly identifies 1 source reporting");
assert(singleGroup.assessment.agreementLevel === "INSUFFICIENT_DATA", "Single source classified as INSUFFICIENT_DATA");
assert(singleGroup.assessment.dataConsistencyScore <= 40, "Single source consistency score reflects unverified state");

// ── TEST 8: Revision History Retention ────────────────────────────────────
console.log("\n--- TEST 8: Revision History Preservation ---");
assert(Array.isArray(usgsObs.revisions), "Revisions array is present on observation");
assert(usgsObs.revisions.length >= 2, "Multiple historical revisions logged without deletion of previous values");
assert(usgsObs.revisions[0].status === "PRELIMINARY", "Historical preliminary value retained in audit trail");
assert(usgsObs.status === "REVIEWED", "Current status is reviewed while keeping historical trail intact");

// ── TEST 9: Geographic Roles & Nepal Context ──────────────────────────────
console.log("\n--- TEST 9: Nepal Geographic Context ---");
assert(assessment.nepalContext.isInsideNepal, "Mustang event correctly identified as inside Nepal");
assert(assessment.nepalContext.contextualNote.includes("Local and regional observations are particularly relevant"), "Contextual note explains importance of local/regional monitoring");

// ── TEST 10: Official Traceability & Provenance ───────────────────────────
console.log("\n--- TEST 10: Official Provenance & URLs ---");
assert(nemrcObs.sourceUrl.includes("seismonepal.gov.np"), "NEMRC links to official seismonepal.gov.np portal");
assert(usgsObs.sourceUrl.includes("earthquake.usgs.gov"), "USGS links to official earthquake.usgs.gov event page");
assert(cencObs.sourceUrl.includes("ceic.ac.cn"), "CENC links to official news.ceic.ac.cn portal");

console.log("\n=====================================================================");
console.log(`TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log("=====================================================================");

if (failed > 0) process.exit(1);
