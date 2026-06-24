/**
 * Nepal Seismic — Quiz responses → Google Sheet in your Drive
 *
 * This is a Google Apps Script Web App. It receives each finished quiz result
 * (POSTed by src/routes/test-yourself.tsx) and appends a row to a Google Sheet
 * that lives in YOUR Google Drive. No OAuth is needed in the website.
 *
 * SETUP (one time):
 *  1. Go to https://script.google.com → New project.
 *  2. Delete the default code and paste this whole file in.
 *  3. Deploy ▸ New deployment ▸ type "Web app".
 *       - Description: anything
 *       - Execute as:  Me (your account)
 *       - Who has access: Anyone
 *     Click Deploy and authorize when prompted.
 *  4. Copy the Web app URL (ends in /exec).
 *  5. In the project root create .env.local with:
 *       VITE_QUIZ_WEBHOOK_URL=<that /exec URL>
 *     then restart the dev server.
 *
 * The script auto-creates a spreadsheet named below in your Drive on first
 * submission and reuses it after that (the id is cached in script properties).
 * Open your Drive and you'll find it filling up with responses.
 */

const SHEET_NAME = "Nepal Seismic — Quiz Responses";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Submitted At", "Name", "Score", "Total", "Percent", "Rating",
        "Breakdown", "Answers (JSON)", "User Agent",
      ]);
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name || "Anonymous",
      data.score,
      data.total,
      data.percent,
      data.rating,
      JSON.stringify(data.breakdown || {}),
      JSON.stringify(data.answers || []),
      data.userAgent || "",
    ]);

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

// Lets you sanity-check the deployment in a browser (should print {"status":"ok"}).
function doGet() {
  return json_({ status: "ok" });
}

function getSheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SPREADSHEET_ID");
  let ss = null;

  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty("SPREADSHEET_ID", ss.getId());
  }
  return ss.getSheets()[0];
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
