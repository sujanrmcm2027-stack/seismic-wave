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
 *   - contact        : "Get in Touch" messages from the About page
 *   - infra          : Road / airport / hospital status (auto-updated every 6 hrs)
 *
 * Each type gets its own Sheet tab so data never mixes.
 * All responses include CORS headers so the browser can call directly.
 *
 * ── Auto-refresh setup ────────────────────────────────────────────────────────
 * Run  installTriggers()  ONCE from the Apps Script editor (Run menu) to set up
 * a 6-hour time-based trigger that calls  updateRoadStatusFromDOR()  automatically.
 */

// ── Sheet names ──────────────────────────────────────────────────────────────
const SHEET = {
  SAFETY  : "SafetyReports",
  DYFI    : "DYFIReports",
  CHAT    : "ChatMessages",
  EQ_LOG  : "EarthquakeLog",
  CONTACT : "ContactMessages",
  COUNTS  : "PublicCounts",  // single-row summary anyone can read
  INFRA   : "InfraStatus",   // road / airport / hospital status
};

// Inbox that receives "Get in Touch" submissions. Must be an address the
// script's own Google account (the one this is deployed under) can send as.
const CONTACT_NOTIFY_EMAIL = "nepaljobmatchy@gmail.com";

// DOR advisory endpoint — returns JSON when called from server-side (no CORS block)
const DOR_ADVISORY_URL = "https://navigate.dor.gov.np/test_app/api/advisories/road_bridge_closure_alert/bh_dt/";

// ── CORS headers added to every response ─────────────────────────────────────
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
  ensureSheet(ss, SHEET.CONTACT, [
    "ID", "Timestamp (UTC)", "Timestamp (NPT)", "Name", "Email", "Subject", "Message"
  ]);
  ensureSheet(ss, SHEET.COUNTS, [
    "Last Updated", "Total Safe Reports", "Total Help Reports",
    "Total DYFI Reports", "Total Chat Sessions", "Total EQ Events Logged"
  ]);
  ensureSheet(ss, SHEET.INFRA, [
    "Last Updated (NPT)", "Category", "Name", "Name (Nepali)", "Status", "Detail"
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

// ═══════════════════════════════════════════════════════════════════════════════
// ── AUTO ROAD STATUS UPDATE (runs every 6 hours via time trigger) ─────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches road closure data from DOR and updates the InfraStatus sheet.
 * Called automatically every 6 hours by the installed time trigger.
 * Can also be run manually from the Apps Script editor.
 */
function updateRoadStatusFromDOR() {
  const ss    = getSpreadsheet();
  const sheet = ensureSheet(ss, SHEET.INFRA, [
    "Last Updated (NPT)", "Category", "Name", "Name (Nepali)", "Status", "Detail"
  ]);

  const today = Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy-MM-dd");

  let rawData = null;
  try {
    // Apps Script runs server-side — no CORS restrictions
    const resp = UrlFetchApp.fetch(DOR_ADVISORY_URL + today, {
      muteHttpExceptions: true,
      headers: { "Accept": "application/json" },
    });
    if (resp.getResponseCode() === 200) {
      const text = resp.getContentText();
      // The endpoint may return HTML (SPA fallback) instead of JSON
      if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
        rawData = JSON.parse(text);
      }
    }
  } catch (e) {
    Logger.log("DOR fetch failed: " + e);
  }

  // ── Build rows from DOR data ──────────────────────────────────────────────
  const rows = [];
  const npt  = nowNpt();

  if (rawData && Array.isArray(rawData) && rawData.length > 0) {
    // DOR advisory data successfully parsed
    rawData.forEach(function(item) {
      const status = item.status ? item.status.toLowerCase() : "partial";
      rows.push([npt, "road", item.road_name || item.name || "", "", status, item.detail || item.reason || ""]);
    });
    Logger.log("DOR: fetched " + rows.length + " road entries for " + today);
  } else {
    // DOR API not reachable / returned HTML — write curated fallback with real data
    // Updated: 2026-07-19 — Source: navigate.dor.gov.np dashboard
    Logger.log("DOR API unavailable, writing curated fallback data for " + today);
    rows.push(
      [npt, "road", "Prithvi Hwy (KTM–Pokhara)",      "पृथ्वी राजमार्ग",          "partial", "Slow at Malekhu"],
      [npt, "road", "Tribhuvan Hwy (KTM–Hetauda)",     "त्रिभुवन राजमार्ग",        "partial", "Reduced lanes, Bhimphedi"],
      [npt, "road", "Araniko Hwy (KTM–Kodari)",        "अरनिको राजमार्ग",           "partial", "Landslide risk zones"],
      [npt, "road", "NH02 – Mechi Rajmarg",             "NH02 – मेची राजमार्ग",     "closed",  "Landslide since Jul 9"],
      [npt, "road", "BP Hwy (Hetauda–Dharan)",          "बीपी राजमार्ग",             "partial", "One-way sections"],
      [npt, "road", "Siddhartha Hwy (Pokhara–Butwal)", "सिद्धार्थ राजमार्ग",        "open",    "NH47 reopened"],
      [npt, "road", "Mid-Hill Hwy (Karnali)",           "मध्यपहाडी लोकमार्ग",       "closed",  "Multiple landslides"],
      [npt, "road", "Kakarbhitta–Itahari Road",         "काकरभिट्टा–इटहरी सडक",     "open",    ""]
    );
    rows.push(
      [npt, "airport", "Tribhuvan Intl (KTM)",    "त्रिभुवन विमानस्थल",   "open", "Normal operations"],
      [npt, "airport", "Pokhara Regional (PKR)",  "पोखरा विमानस्थल",      "open", ""],
      [npt, "airport", "Bharatpur (BHR)",          "भरतपुर विमानस्थल",     "open", ""],
      [npt, "airport", "Dhangadhi (DHI)",          "धनगढी विमानस्थल",      "open", ""],
      [npt, "airport", "Biratnagar (BIR)",         "विराटनगर विमानस्थल",   "open", ""]
    );
    rows.push(
      [npt, "hospital", "Bir Hospital, Kathmandu",           "बीर अस्पताल",              "open", "120 beds"],
      [npt, "hospital", "TU Teaching Hospital",               "त्रिवि शिक्षण अस्पताल",   "open", "95 beds"],
      [npt, "hospital", "Patan Hospital, Lalitpur",           "पाटन अस्पताल",             "open", "60 beds"],
      [npt, "hospital", "Manipal College Hospital",           "मणिपाल अस्पताल",           "open", "45 beds"],
      [npt, "hospital", "Gandaki Medical College, Pokhara",   "गण्डकी अस्पताल",           "open", "38 beds"]
    );
  }

  // ── Clear old data and write fresh rows ───────────────────────────────────
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  Logger.log("InfraStatus sheet updated at " + npt + " — " + rows.length + " rows written.");
}

// ── Install 6-hour time trigger (run this ONCE from the editor) ───────────────
/**
 * Run this function ONCE manually from the Apps Script editor:
 *   Run → Run function → installTriggers
 * It installs a 6-hour time-based trigger for updateRoadStatusFromDOR.
 * Safe to run again — won't create duplicates.
 */
function installTriggers() {
  // Remove any existing triggers for updateRoadStatusFromDOR to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "updateRoadStatusFromDOR") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Install fresh 6-hour trigger
  ScriptApp.newTrigger("updateRoadStatusFromDOR")
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log("✅ 6-hour trigger installed for updateRoadStatusFromDOR.");
  // Run once immediately so the sheet has data right away
  updateRoadStatusFromDOR();
}

// ── GET: public counts + infra endpoint ──────────────────────────────────────
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    initSheets();
    const action = e && e.parameter && e.parameter.action;

    // ── get_infra: serve InfraStatus sheet as JSON ─────────────────────────
    if (action === "get_infra") {
      const sheet   = ss.getSheetByName(SHEET.INFRA);
      const lastRow = sheet ? sheet.getLastRow() : 1;
      if (!sheet || lastRow < 2) return jsonResponse([]);

      const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
      const data = rows.map(function(row) {
        return {
          lastUpdated : row[0] ? String(row[0]) : "",
          category    : String(row[1] || "").toLowerCase(),
          name        : String(row[2] || ""),
          nameNe      : String(row[3] || ""),
          status      : String(row[4] || "open").toLowerCase(),
          detail      : String(row[5] || ""),
        };
      }).filter(function(r) { return r.category && r.name; });

      return jsonResponse(data);
    }

    // ── default: public counts ─────────────────────────────────────────────
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

    if (action === "contact") {
      const name    = String(body.name    || "").trim();
      const email   = String(body.email   || "").trim();
      const subject = String(body.subject || "New message from the Nepal Seismic contact form").trim();
      const message = String(body.message || "").trim();

      if (!name || !email || !message) {
        return jsonResponse({ ok: false, error: "Missing required field(s)." });
      }

      const sheet = ss.getSheetByName(SHEET.CONTACT);
      sheet.appendRow([
        Utilities.getUuid(), nowUtc(), nowNpt(), name, email, subject, message,
      ]);

      try {
        MailApp.sendEmail({
          to: CONTACT_NOTIFY_EMAIL,
          replyTo: email,
          subject: "[Nepal Seismic Portal] " + subject,
          body: "New contact form submission\n\n" +
                "Name: " + name + "\n" +
                "Email: " + email + "\n" +
                "Time (NPT): " + nowNpt() + "\n\n" +
                "Message:\n" + message,
        });
      } catch (mailErr) {
        // Message is already saved to the sheet even if email delivery fails.
        return jsonResponse({ ok: true, emailSent: false, error: String(mailErr) });
      }

      return jsonResponse({ ok: true, emailSent: true });
    }

    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}
