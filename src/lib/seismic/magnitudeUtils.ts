/**
 * magnitudeUtils.ts — Magnitude Scale Intelligence & Comparison
 * ===============================================================
 * Handles scale compatibility (ML, Mw, mb, Ms, etc.) per Section 5.
 * Strictly avoids blind averaging of incompatible physical scales.
 */

export interface MagnitudeComparisonResult {
  areDirectlyComparable: boolean;
  maxDifference: number;
  displayText: string;
  summaryNotes: string;
  scalesReported: string[];
}

// Known physical characteristics of common seismic scales:
// - ML (Richter / Local): high-frequency local S-waves, saturates around ~6.5
// - mb (Body wave): 1-second P-waves, teleseismic, saturates around ~6.0-6.5
// - Ms (Surface wave): 20-second Rayleigh waves, shallow events, saturates around ~8.0
// - Mw / Mww / Mwb / Mwr (Moment magnitude): based on physical seismic moment, no saturation
const MOMENT_TYPES = new Set(["mw", "mww", "mwb", "mwr", "mwc"]);

export function areMagnitudeScalesComparable(typeA: string, typeB: string): boolean {
  const normA = (typeA || "").trim().toLowerCase();
  const normB = (typeB || "").trim().toLowerCase();

  if (normA === normB) return true;

  // Both are variants of moment magnitude
  if (MOMENT_TYPES.has(normA) && MOMENT_TYPES.has(normB)) return true;

  // For smaller earthquakes (M < 4.5), ML and mb are roughly comparable within ±0.3 units,
  // but strictly speaking they sample different wave frequencies.
  return false;
}

export function evaluateMagnitudeConsistency(
  observations: Array<{ magnitude: number; magType: string; source: string }>,
): MagnitudeComparisonResult {
  if (observations.length <= 1) {
    return {
      areDirectlyComparable: true,
      maxDifference: 0,
      displayText: "Single source report",
      summaryNotes: "Baseline measurement from single reporting agency.",
      scalesReported: observations.map((o) => o.magType),
    };
  }

  const scales = Array.from(new Set(observations.map((o) => o.magType.toUpperCase())));
  const values = observations.map((o) => o.magnitude);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const diff = Math.round((maxVal - minVal) * 10) / 10;

  // Check if all scales match or belong to the same family
  let allComparable = true;
  for (let i = 0; i < observations.length; i++) {
    for (let j = i + 1; j < observations.length; j++) {
      if (!areMagnitudeScalesComparable(observations[i].magType, observations[j].magType)) {
        allComparable = false;
        break;
      }
    }
    if (!allComparable) break;
  }

  if (!allComparable) {
    return {
      areDirectlyComparable: false,
      maxDifference: diff,
      displayText: "Different magnitude scales reported",
      summaryNotes: `Agencies reported varying scales (${scales.join(", ")}). Direct numerical equivalence is not assumed.`,
      scalesReported: scales,
    };
  }

  return {
    areDirectlyComparable: true,
    maxDifference: diff,
    displayText: diff <= 0.3 ? "Consistent magnitudes" : "Moderate magnitude variation",
    summaryNotes: `Values measured on comparable scales (${scales.join(", ")}) with ${diff.toFixed(1)} unit spread.`,
    scalesReported: scales,
  };
}

/**
 * Computes representative magnitude for user orientation.
 * Clearly designated as derived/representative, not "true" or "official".
 */
export function calculateRepresentativeMagnitude(magnitudes: number[]): {
  representative: number;
  min: number;
  max: number;
  spread: number;
} {
  if (!magnitudes.length) {
    return { representative: 0, min: 0, max: 0, spread: 0 };
  }
  const min = Math.min(...magnitudes);
  const max = Math.max(...magnitudes);
  const spread = Math.round((max - min) * 10) / 10;

  // Median or trimmed value rather than arbitrary weighted bias
  const sorted = [...magnitudes].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    representative: Math.round(median * 10) / 10,
    min,
    max,
    spread,
  };
}
