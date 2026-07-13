/**
 * dataService.ts — Nepal Seismic Portal Data Abstraction Layer
 * ==============================================================
 * Centralized service for all data interactions (fetching, appending, updating).
 * Designed to easily transition to a secure production database behind a firewall.
 *
 * Current implementation uses Google Apps Script / Google Sheets for writes,
 * and a remote/local fallback combination for Safe Zones.
 */

import type { SafeZoneCollection } from "@/data/evacuationZones";

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined;
const SAFE_ZONES_URL = import.meta.env.VITE_SAFE_ZONES_API_URL || "/fallback_safe_zones.json";
const FALLBACK_URL = "/fallback_safe_zones.json";

// ── Types ──────────────────────────────────────────────────────────────
export type PublicCounts = {
  safeCount: number;
  helpCount: number;
  dyfiCount: number;
  chatCount: number;
  eqLogCount: number;
  lastUpdated: string | null;
};

// ── Internal Helpers ───────────────────────────────────────────────────
async function post(body: object): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    return json.ok === true;
  } catch {
    return false;
  }
}

// ── Safe Zones (Read-Only) ─────────────────────────────────────────────
/**
 * Fetches the nationwide safe zones dataset.
 * Attempts the remote API URL first, falls back to the bundled local JSON
 * on network failure or rate limit.
 */
export async function fetchSafeZones(): Promise<{ data: SafeZoneCollection; isOfflineFallback: boolean }> {
  try {
    const response = await fetch(SAFE_ZONES_URL);
    if (!response.ok) {
      throw new Error(`Primary Safe Zones API failed: ${response.status}`);
    }
    const data = (await response.json()) as SafeZoneCollection;
    return { data, isOfflineFallback: false };
  } catch (err) {
    console.warn("Falling back to local offline safe zones data:", err);
    // Graceful fallback interception
    const fallbackResponse = await fetch(FALLBACK_URL);
    if (!fallbackResponse.ok) {
      throw new Error("Critical: Offline fallback data is also unreachable.");
    }
    const data = (await fallbackResponse.json()) as SafeZoneCollection;
    return { data, isOfflineFallback: true };
  }
}

// ── Participant Counts (Read-Only) ──────────────────────────────────────
export async function fetchPublicCounts(): Promise<PublicCounts | null> {
  if (!SCRIPT_URL) return null;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_counts`, { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) return null;
    return {
      safeCount: Number(json.safeCount ?? 0),
      helpCount: Number(json.helpCount ?? 0),
      dyfiCount: Number(json.dyfiCount ?? 0),
      chatCount: Number(json.chatCount ?? 0),
      eqLogCount: Number(json.eqLogCount ?? 0),
      lastUpdated: json.lastUpdated ?? null,
    };
  } catch {
    return null;
  }
}

// ── Safety Status Report (Write) ────────────────────────────────────────
export async function syncSafetyReport(payload: {
  userId: string;
  status: "safe" | "help";
  name: string;
  location: string;
  note: string;
}) {
  return post({ action: "status", ...payload });
}

// ── DYFI Intensity Report (Write) ───────────────────────────────────────
export async function syncDyfiReport(payload: {
  intensity: string;
  lat: number;
  lng: number;
  accuracy: number;
  source: string;
  timestampNpt: string;
}) {
  return post({ action: "dyfi", ...payload });
}

// ── Chat Message (Write - Anonymised) ───────────────────────────────────
export async function syncChatMessage(role: "user" | "assistant", message: string) {
  return post({ action: "chat", role, message: message.slice(0, 300) });
}

// ── Earthquake Events Batch Upload (Write) ──────────────────────────────
let eqSyncPending = false;

export async function syncEarthquakeEvents(events: {
  eventId: string;
  magnitude: number;
  place: string;
  latitude: number;
  longitude: number;
  depth: number;
  magType: string;
  url: string;
}[]) {
  if (eqSyncPending || !events.length) return;
  eqSyncPending = true;
  try {
    await post({ action: "eq_log", events });
  } finally {
    eqSyncPending = false;
  }
}
