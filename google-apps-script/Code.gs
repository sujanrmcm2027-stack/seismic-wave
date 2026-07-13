/**
 * Nepal Seismic Portal — Google Apps Script Backend
 * ===================================================
 * Deploy this as a Web App:
 *   Extensions → Apps Script → Paste this code → Deploy → New deployment
 *   Execute as: Me | Who has access: Anyone (no login required)
 
 * This script handles ALL data types the portal writes:
 *   - safety_status  : I am Safe / Need Help reports
 *   - dyfi           : Did You Feel It? intensity reports
 *   - chat_message   : Suraksha chatbot messages (anonymised)
 *   - earthquake_log : USGS events seen by users
 *
 * Each type gets its own Sheet tab so data never mixes.
 * All responses include CORS headers so the browser can call directly.
 */

// ── Sheet names ──────────────────────────────────────────────────────────────
const SHEET = {
  SAFETY  : "SafetyReports",
  DYFI    : "DYFIReports",
  CHAT    : "ChatMessages",
  EQ_LOG  : "EarthquakeLog",
  COUNTS  : "PublicCounts",  // single-row summary anyone can read
};

// ── CORS headers added to every response ─────────────────────────────────────
function cors(output) {
  return output
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

function jsonResponse(data) {
  return cors(
    ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
  );
}

// ── Ensure a sheet tab exists with the right headers ─────────────────────────
function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ── Initialise all sheets ────────────────────────────────────────────────────
function initSheets() {
  const ss = getSpreadsheet();
  ensureSheet(ss, SHEET.SAFETY, [
    "ID", "Timestamp (UTC)", "Timestamp (NPT)", "Status",
    "Name", "Location", "Note", "UserID"
  ]);
  ensureSheet(ss, SHEET.DYFI, [
    "ID", "Timestamp (UTC)", "Timestamp (NPT)", "Intensity",
    "Latitude", "Longitude", "Accuracy (m)", "Source"
  ]);
  ensureSheet(ss, SHEET.CHAT, [
    "ID", "Timestamp (UTC)", "Timestamp (NPT)", "Role", "Message (truncated)"
  ]);
  ensureSheet(ss, SHEET.EQ_LOG, [
    "EventID", "First Seen (UTC)", "Magnitude", "Place",
    "Latitude", "Longitude", "Depth (km)", "MagType", "USGS URL"
  ]);
  ensureSheet(ss, SHEET.COUNTS, [
    "Last Updated", "Total Safe Reports", "Total Help Reports",
    "Total DYFI Reports", "Total Chat Sessions", "Total EQ Events Logged"
  ]);
  const counts = ss.getSheetByName(SHEET.COUNTS);
  if (counts.getLastRow() < 2) {
    counts.appendRow([new Date(), 0, 0, 0, 0, 0]);
  }
}

// ── Update the single summary counts row ─────────────────────────────────────
function refreshCounts(ss) {
  const safety = ss.getSheetByName(SHEET.SAFETY);
  const dyfi   = ss.getSheetByName(SHEET.DYFI);
  const chat   = ss.getSheetByName(SHEET.CHAT);
  const eqLog  = ss.getSheetByName(SHEET.EQ_LOG);
  const counts = ss.getSheetByName(SHEET.COUNTS);

  const safeRows = safety ? Math.max(0, safety.getLastRow()  - 1) : 0;
  const dyfiRows = dyfi   ? Math.max(0, dyfi.getLastRow()   - 1) : 0;
  const chatRows = chat   ? Math.max(0, chat.getLastRow()   - 1) : 0;
  const eqRows   = eqLog  ? Math.max(0, eqLog.getLastRow()  - 1) : 0;

  let safeCount = 0, helpCount = 0;
  if (safety && safeRows > 0) {
    const statuses = safety.getRange(2, 4, safeRows, 1).getValues();
    statuses.forEach(([s]) => { if (s === "safe") safeCount++; else helpCount++; });
  }

  counts.getRange(2, 1, 1, 6).setValues([[
    new Date(), safeCount, helpCount, dyfiRows, chatRows, eqRows
  ]]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nowNpt() {
  return Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy-MM-dd HH:mm:ss");
}
function nowUtc() {
  return Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd HH:mm:ss");
}

// ── GET: public counts endpoint ───────────────────────────────────────────────
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    initSheets();
    const counts = ss.getSheetByName(SHEET.COUNTS);
    const row = counts.getRange(2, 1, 1, 6).getValues()[0];
    return jsonResponse({
      ok          : true,
      lastUpdated : row[0] ? new Date(row[0]).toISOString() : null,
      safeCount   : Number(row[1] || 0),
      helpCount   : Number(row[2] || 0),
      dyfiCount   : Number(row[3] || 0),
      chatCount   : Number(row[4] || 0),
      eqLogCount  : Number(row[5] || 0),
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// ── POST: all write operations ────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = getSpreadsheet();
    initSheets();

    if (action === "status") {
      const sheet = ss.getSheetByName(SHEET.SAFETY);
      sheet.appendRow([
        body.userId   || Utilities.getUuid(),
        nowUtc(),
        nowNpt(),
        body.status   || "",
        body.name     || "",
        body.location || "",
        body.note     || "",
        body.userId   || "",
      ]);
      refreshCounts(ss);
      return jsonResponse({ ok: true });
    }

    if (action === "dyfi") {
      const sheet = ss.getSheetByName(SHEET.DYFI);
      sheet.appendRow([
        Utilities.getUuid(),
        nowUtc(),
        body.timestampNpt || nowNpt(),
        body.intensity    || "",
        body.lat          || "",
        body.lng          || "",
        body.accuracy     || "",
        body.source       || "approx",
      ]);
      refreshCounts(ss);
      return jsonResponse({ ok: true });
    }

    if (action === "chat") {
      const sheet = ss.getSheetByName(SHEET.CHAT);
      const msg = String(body.message || "").slice(0, 300);
      sheet.appendRow([
        Utilities.getUuid(),
        nowUtc(),
        nowNpt(),
        body.role || "user",
        msg,
      ]);
      refreshCounts(ss);
      return jsonResponse({ ok: true });
    }

    if (action === "eq_log") {
      const events = Array.isArray(body.events) ? body.events : [];
      if (!events.length) return jsonResponse({ ok: true, logged: 0 });

      const sheet = ss.getSheetByName(SHEET.EQ_LOG);
      const lastRow = sheet.getLastRow();
      const existingIds = new Set();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 1).getValues()
          .forEach(([id]) => existingIds.add(String(id)));
      }

      let logged = 0;
      events.forEach((ev) => {
        const key = String(ev.eventId || ev.id || "");
        if (!key || existingIds.has(key)) return;
        existingIds.add(key);
        sheet.appendRow([
          key, nowUtc(),
          ev.magnitude || "", ev.place || "",
          ev.latitude  || "", ev.longitude || "",
          ev.depth     || "", ev.magType   || "",
          ev.url       || "",
        ]);
        logged++;
      });

      if (logged > 0) refreshCounts(ss);
      return jsonResponse({ ok: true, logged });
    }

    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doOptions() {
  return cors(ContentService.createTextOutput(""));
}
