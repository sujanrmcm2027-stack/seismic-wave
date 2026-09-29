/**
 * ==============================================================================
 * NEPAL SEISMIC & CRISIS INTELLIGENCE — MASTER GOOGLE APPS SCRIPT
 * ==============================================================================
 * This script runs inside your Google Sheet (Extensions > Apps Script).
 * 
 * FEATURES:
 * 1. Multi-Tab Architecture:
 *    - 'Seismic_Tremors' (All tremors recorded since 2026 + historical events)
 *    - 'Roads_Live' (Current latest status of national highways)
 *    - 'Roads_YYYY_MM' (Separate monthly tabs for all 15-minute road updates)
 *    - 'Verified_News_&_Incidents' (Authentic reports from BIPAD, NDRRMA, news portals)
 *    - 'Citizen_Help_&_Safety' (Community check-ins, "Need Help" alerts, locations)
 *    - 'Municipal_Damage_DDNA' (Standardized damage reporting: G1-G5, human impact)
 *    - 'GoBag_Checklist_Downloads' (72-Hour kit downloads and completion tracking)
 *    - 'AI_Crisis_Chat_Logs' (Citizen disaster questions and assistance logs)
 * 
 * 2. Automated Daily Midnight Sync (12:00 AM NPT):
 *    - Automatically archives daily records and organizes monthly sheets every midnight.
 * 
 * 3. Real-Time Webhook API:
 *    - Receives live posts from the web portal and appends rows instantly.
 * ==============================================================================
 */

// ── SETUP & INITIALIZATION ───────────────────────────────────────────────────

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetConfigs = [
    {
      name: "Seismic_Tremors",
      headers: [
        "Event ID", "Date (NPT)", "Time (NPT)", "Magnitude", "Mag Type",
        "Depth (km)", "Epicenter / District", "Latitude", "Longitude",
        "Source Agencies", "Agreement Level", "Verification URL", "Logged At"
      ],
      headerColor: "#1e3a8a", // Navy
    },
    {
      name: "Roads_Live",
      headers: [
        "Highway Code", "Highway Name", "Name (Nepali)", "Status",
        "Condition / Landslide Details", "Last Updated (NPT)", "Source Portal"
      ],
      headerColor: "#065f46", // Emerald
    },
    {
      name: "Verified_News_&_Incidents",
      headers: [
        "Incident ID", "Timestamp (NPT)", "District", "Location", "Category",
        "Disaster Phase", "Headline", "Details", "Authentic Source", "Latitude", "Longitude"
      ],
      headerColor: "#7c2d12", // Amber/Brown
    },
    {
      name: "Citizen_Help_&_Safety",
      headers: [
        "Timestamp (NPT)", "Status", "Full Name", "District / Location",
        "Emergency Note", "User ID", "Forwarded to NDRRMA"
      ],
      headerColor: "#991b1b", // Red
    },
    {
      name: "Municipal_Damage_DDNA",
      headers: [
        "Report ID", "Timestamp (NPT)", "Province", "District", "Municipality",
        "Ward", "G1 (Negligible)", "G2 (Slight)", "G3 (Moderate)", "G4 (Substantial)",
        "G5 (Collapse)", "Deaths", "Injuries", "Displaced Families", "Schools Damaged",
        "Health Facilities", "Immediate Needs", "Surveyor Name", "Phone", "Compliance (72h)"
      ],
      headerColor: "#581c87", // Purple
    },
    {
      name: "GoBag_Checklist_Downloads",
      headers: [
        "Timestamp (NPT)", "Action Type", "Language", "Items Checked Total",
        "Completed Percentage", "Source Page"
      ],
      headerColor: "#0f766e", // Teal
    },
    {
      name: "AI_Crisis_Chat_Logs",
      headers: [
        "Timestamp (NPT)", "Role", "Citizen Inquiry / Response Summary", "Length"
      ],
      headerColor: "#374151", // Gray
    },
  ];

  sheetConfigs.forEach(function (cfg) {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }
    formatSheetHeaders(sheet, cfg.headers, cfg.headerColor);
  });

  // Setup Midnight Trigger
  setupDailyMidnightTrigger();

  SpreadsheetApp.getUi().alert(
    "Setup Complete!\n\nAll 7 research tabs have been formatted with professional headers and freeze panes. The automated 12:00 Midnight daily sync trigger is active."
  );
}

function formatSheetHeaders(sheet, headers, bgColor) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground(bgColor)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontFamily("IBM Plex Sans")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 32);

  // Auto-fit column widths
  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
    if (sheet.getColumnWidth(col) < 110) {
      sheet.setColumnWidth(col, 110);
    }
  }
}

// ── DAILY 12:00 MIDNIGHT AUTOMATED TRIGGER ───────────────────────────────────

function setupDailyMidnightTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "dailyMidnightSync") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Trigger daily around 00:00 midnight Nepal Time
  ScriptApp.newTrigger("dailyMidnightSync")
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .nearMinute(5)
    .create();
}

function dailyMidnightSync() {
  const now = new Date();
  const yearMonth = Utilities.formatDate(now, "Asia/Kathmandu", "yyyy_MM");
  const monthSheetName = "Roads_" + yearMonth;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let monthSheet = ss.getSheetByName(monthSheetName);

  if (!monthSheet) {
    monthSheet = ss.insertSheet(monthSheetName);
    const headers = [
      "Timestamp (NPT)", "Category", "Highway Name", "Name (Nepali)",
      "Status", "Condition / Landslide Details", "Archived Date"
    ];
    formatSheetHeaders(monthSheet, headers, "#065f46");
  }

  // Copy active road items from Roads_Live into the monthly archive sheet
  const liveSheet = ss.getSheetByName("Roads_Live");
  if (liveSheet && liveSheet.getLastRow() > 1) {
    const liveData = liveSheet.getRange(2, 1, liveSheet.getLastRow() - 1, 6).getValues();
    const archiveRows = liveData.map(function (row) {
      return [
        Utilities.formatDate(now, "Asia/Kathmandu", "yyyy-MM-dd HH:mm:ss 'NPT'"),
        "road",
        row[1], // Highway Name
        row[2], // Name Nepali
        row[3], // Status
        row[4], // Details
        Utilities.formatDate(now, "Asia/Kathmandu", "yyyy-MM-dd")
      ];
    });

    monthSheet.getRange(monthSheet.getLastRow() + 1, 1, archiveRows.length, archiveRows[0].length).setValues(archiveRows);
  }

  Logger.log("Daily midnight sync executed successfully for: " + monthSheetName);
}

// ── WEBHOOK POST HANDLER (RECEIVES LIVE WEB PORTAL DATA) ─────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nowNpt = Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy-MM-dd HH:mm:ss 'NPT'");

    // 1. Seismic Tremor Log
    if (action === "eq_log" && data.events) {
      const sheet = ss.getSheetByName("Seismic_Tremors");
      if (sheet) {
        data.events.forEach(function (eq) {
          sheet.appendRow([
            eq.eventId || "",
            eq.originTimeNpt ? eq.originTimeNpt.split(" ")[0] : "",
            eq.originTimeNpt || nowNpt,
            eq.magnitude || "",
            eq.magnitudeType || "Mw",
            eq.depthKm !== undefined ? eq.depthKm : "",
            eq.placeName || "",
            eq.latitude || "",
            eq.longitude || "",
            Array.isArray(eq.reportingAgencies) ? eq.reportingAgencies.join(", ") : (eq.source || ""),
            eq.agreementLevel || "HIGH",
            eq.sourceUrl || "",
            nowNpt
          ]);
        });
      }
    }

    // 2. Road Status Log
    else if (action === "road_log" && data.items) {
      const liveSheet = ss.getSheetByName("Roads_Live");
      if (liveSheet) {
        // Clear previous live rows and update with fresh snapshot
        if (liveSheet.getLastRow() > 1) {
          liveSheet.getRange(2, 1, liveSheet.getLastRow() - 1, 7).clearContent();
        }
        data.items.forEach(function (r) {
          liveSheet.appendRow([
            r.highwayCode || "ROAD",
            r.name || "",
            r.nameNe || "",
            r.status || "open",
            r.detail || "",
            r.lastUpdated || nowNpt,
            "navigate.dor.gov.np"
          ]);
        });
      }

      // Also append disrupted roads (partial/closed) to current month's archive
      const yearMonth = Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy_MM");
      const monthSheetName = "Roads_" + yearMonth;
      let monthSheet = ss.getSheetByName(monthSheetName);
      if (!monthSheet) {
        monthSheet = ss.insertSheet(monthSheetName);
        formatSheetHeaders(monthSheet, [
          "Timestamp (NPT)", "Category", "Highway Name", "Name (Nepali)",
          "Status", "Condition / Landslide Details", "Archived Date"
        ], "#065f46");
      }
      data.items.forEach(function (r) {
        if (r.status === "closed" || r.status === "partial" || r.detail) {
          monthSheet.appendRow([
            nowNpt, "road", r.name || "", r.nameNe || "", r.status || "",
            r.detail || "", Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy-MM-dd")
          ]);
        }
      });
    }

    // 3. Citizen Help & Safety Status
    else if (action === "status" || action === "help_request") {
      const sheet = ss.getSheetByName("Citizen_Help_&_Safety");
      if (sheet) {
        sheet.appendRow([
          nowNpt,
          data.status === "help" ? "🚨 NEED HELP" : "✅ SAFE",
          data.name || "Anonymous Citizen",
          data.location || "Nepal",
          data.note || "",
          data.userId || "",
          data.status === "help" ? "Queued for NDRRMA / Local Response" : "Logged"
        ]);
      }
    }

    // 4. Municipal DDNA Damage Report
    else if (action === "damage_assessment") {
      const sheet = ss.getSheetByName("Municipal_Damage_DDNA");
      if (sheet) {
        const d = data.report || data;
        const struct = d.structuralDamage || {};
        const impact = d.humanImpact || {};
        const infra = d.criticalInfrastructure || {};
        const sub = d.submittedBy || {};

        sheet.appendRow([
          d.id || ("DDNA-" + Date.now()),
          nowNpt,
          d.province || "",
          d.district || "",
          d.localLevel || "",
          d.ward || "",
          struct.grade1Negligible || 0,
          struct.grade2Slight || 0,
          struct.grade3Moderate || 0,
          struct.grade4Substantial || 0,
          struct.grade5Collapse || 0,
          impact.deaths || 0,
          impact.injuries || 0,
          impact.displacedFamilies || 0,
          infra.schoolsDamaged || 0,
          infra.healthFacilitiesDamaged || 0,
          Array.isArray(d.immediateNeeds) ? d.immediateNeeds.join("; ") : (d.immediateNeeds || ""),
          sub.name || "",
          sub.phone || "",
          d.within72Hours ? "Yes (Within 72h)" : "Late Submission"
        ]);
      }
    }

    // 5. Go-Bag Checklist Download
    else if (action === "gobag_download") {
      const sheet = ss.getSheetByName("GoBag_Checklist_Downloads");
      if (sheet) {
        sheet.appendRow([
          nowNpt,
          "PDF/Checklist Download",
          data.lang || "en",
          data.itemsChecked || 0,
          (data.completedPercent || 0) + "%",
          data.sourcePage || "/preparedness"
        ]);
      }
    }

    // 6. AI Crisis Chat Inquiry
    else if (action === "chat") {
      const sheet = ss.getSheetByName("AI_Crisis_Chat_Logs");
      if (sheet) {
        sheet.appendRow([
          nowNpt,
          data.role || "user",
          data.message ? data.message.slice(0, 300) : "",
          data.message ? data.message.length : 0
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, timestamp: nowNpt }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET HANDLER (RETURNS LIVE COUNTS & METRICS) ──────────────────────────────

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const helpSheet = ss.getSheetByName("Citizen_Help_&_Safety");
  const eqSheet = ss.getSheetByName("Seismic_Tremors");
  const ddnaSheet = ss.getSheetByName("Municipal_Damage_DDNA");

  let safeCount = 0;
  let helpCount = 0;

  if (helpSheet && helpSheet.getLastRow() > 1) {
    const statuses = helpSheet.getRange(2, 2, helpSheet.getLastRow() - 1, 1).getValues();
    statuses.forEach(function (r) {
      if (r[0] && r[0].indexOf("HELP") !== -1) helpCount++;
      else safeCount++;
    });
  }

  const eqCount = eqSheet ? Math.max(0, eqSheet.getLastRow() - 1) : 0;
  const ddnaCount = ddnaSheet ? Math.max(0, ddnaSheet.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    safeCount: safeCount,
    helpCount: helpCount,
    eqLogCount: eqCount,
    ddnaCount: ddnaCount,
    lastUpdated: Utilities.formatDate(new Date(), "Asia/Kathmandu", "yyyy-MM-dd HH:mm:ss 'NPT'")
  })).setMimeType(ContentService.MimeType.JSON);
}
