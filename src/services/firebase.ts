/**
 * firebase.ts — Firebase Firestore & Realtime Archive Service
 * =============================================================
 * Academic & Research Data Archive for Nepal Seismic Portal:
 * 1. Seismic Tremor Archive (NEMRC, CENC, USGS multi-source observations)
 * 2. Highway & Road Disruption Logs (DOR Nepal historical status)
 * 3. Airport & Hospital Telemetry
 * 4. Verified News Archive (Authentic crisis reporting)
 * 5. Community Safety & DYFI Intensity Reports
 *
 * Includes automatic offline support, real-time listeners, and
 * export utilities for Google Sheets / CSV / JSON study reference.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

// Read environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if credentials are configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "your_api_key_here"
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.info("[Firebase] Firestore initialized successfully for project:", firebaseConfig.projectId);
  } catch (err) {
    console.error("[Firebase] Initialization error:", err);
  }
} else {
  console.info("[Firebase] Awaiting credentials in .env. Operating in local fallback mode.");
}

export { db };

// ── 1. SEISMIC TREMORS ARCHIVE ───────────────────────────────────────
export interface ArchivedTremor {
  eventId: string;
  source: "NEMRC" | "CENC" | "USGS" | "MULTI_SOURCE";
  originTimeMs: number;
  originTimeNpt: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number | null;
  placeName: string;
  latitude: number;
  longitude: number;
  agreementLevel?: "HIGH" | "MODERATE" | "LOW" | "DISCREPANCY" | "SINGLE_SOURCE";
  reportingAgencies?: string[];
  sourceUrl?: string;
  archivedAt?: any;
}

export async function archiveSeismicTremor(tremor: ArchivedTremor): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, "seismic_tremors_archive", `${tremor.source}_${tremor.eventId}`);
    await setDoc(docRef, {
      ...tremor,
      archivedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase] Error archiving tremor:", err);
    return false;
  }
}

// ── 2. ROAD DISRUPTION SNAPSHOT ARCHIVE ──────────────────────────────
export interface ArchivedRoadIncident {
  highwayCode: string;
  highwayName: string;
  highwayNameNe?: string;
  status: "open" | "partial" | "closed";
  detail?: string;
  timestampNpt: string;
  sourceUrl: string;
  archivedAt?: any;
}

export async function archiveRoadIncident(incident: ArchivedRoadIncident): Promise<boolean> {
  if (!db) return false;
  try {
    const col = collection(db, "road_incident_logs");
    await addDoc(col, {
      ...incident,
      archivedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("[Firebase] Error archiving road incident:", err);
    return false;
  }
}

// ── 3. VERIFIED NEWS ARCHIVE ─────────────────────────────────────────
export interface ArchivedNews {
  portal: string;
  headline: string;
  summary: string;
  url: string;
  publishedAt: string;
  relatedEventId?: string;
  archivedAt?: any;
}

export async function archiveVerifiedNews(news: ArchivedNews): Promise<boolean> {
  if (!db) return false;
  try {
    const col = collection(db, "verified_news_archive");
    await addDoc(col, {
      ...news,
      archivedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("[Firebase] Error archiving news item:", err);
    return false;
  }
}

// ── 4. COMMUNITY SAFETY BOARD (LIVE CLOUD SYNC) ──────────────────────
export interface SafetyCheckIn {
  id?: string;
  userId: string;
  name: string;
  location: string;
  note: string;
  status: "safe" | "help";
  timestamp: number;
}

export async function submitCloudSafetyReport(report: SafetyCheckIn): Promise<boolean> {
  if (!db) {
    // Fallback to localStorage if Firebase not configured
    const existing = JSON.parse(localStorage.getItem("safety_board_reports") || "[]");
    localStorage.setItem("safety_board_reports", JSON.stringify([report, ...existing]));
    window.dispatchEvent(new Event("safety_board_updated"));
    return false;
  }

  try {
    const col = collection(db, "safety_board_reports");
    await addDoc(col, {
      ...report,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("[Firebase] Error submitting safety check-in:", err);
    return false;
  }
}

export function subscribeSafetyBoard(callback: (reports: SafetyCheckIn[]) => void): Unsubscribe | null {
  if (!db) {
    // Read local fallback
    const local = JSON.parse(localStorage.getItem("safety_board_reports") || "[]");
    callback(local);
    return null;
  }

  const q = query(collection(db, "safety_board_reports"), orderBy("timestamp", "desc"), limit(100));
  return onSnapshot(q, (snapshot) => {
    const reports: SafetyCheckIn[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SafetyCheckIn, "id">),
    }));
    callback(reports);
  }, (err) => {
    console.warn("[Firebase] Safety board subscription error:", err);
  });
}

// ── 5. DYFI COMMUNITY INTENSITY REPORTS ──────────────────────────────
export interface CloudDyfiReport {
  id?: string;
  intensity: string;
  lat: number;
  lng: number;
  accuracy: number;
  source: string;
  timestampNpt: string;
  timestamp: number;
}

export async function submitCloudDyfiReport(report: CloudDyfiReport): Promise<boolean> {
  if (!db) return false;
  try {
    await addDoc(collection(db, "dyfi_reports"), {
      ...report,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("[Firebase] Error saving DYFI report:", err);
    return false;
  }
}

// ── 6. DATA EXPORT UTILITIES (FOR RESEARCH / GOOGLE SHEETS) ───────────
export async function exportCollectionToCsv(collectionName: string): Promise<string> {
  if (!db) throw new Error("Firebase database not connected.");
  const colRef = collection(db, collectionName);
  const snap = await getDocs(query(colRef, limit(2000)));

  if (snap.empty) return "";

  const rows: Record<string, any>[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function triggerDownload(content: string, filename: string, type: "text/csv" | "application/json" = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
