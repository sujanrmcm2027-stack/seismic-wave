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
  CONTACT : "ContactMessages",
  COUNTS  : "PublicCounts",  // single-row summary anyone can read
};

// Inbox that receives "Get in Touch" submissions. Must be an address the
// script's own Google account (the one this is deployed under) can send as.
const CONTACT_NOTIFY_EMAIL = "nepaljobmatchy@gmail.com";

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


