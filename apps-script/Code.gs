/**
 * Flame On — Operations Audit · head-office receiver
 * Doc FO-STD-001 · companion to the audit PWA (v8.1)
 *
 * WHAT THIS IS
 * A Google Apps Script bound to a Google Sheet. The audit app posts each completed audit here;
 * this script writes one row to "Audits", one row per finding to "Findings", and files the full
 * JSON (plus any evidence photos) into a Drive folder.
 *
 * SETUP — see DEPLOY.md for the click-by-click version.
 *   1. Create a Google Sheet, name it e.g. "Flame On — Audit submissions".
 *   2. Extensions → Apps Script. Delete the sample code, paste this file, Save.
 *   3. Change SHARED_TOKEN below to your own phrase.
 *   4. Deploy → New deployment → type "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone            <-- required; auditors are not signed in
 *      Copy the /exec URL it gives you.
 *   5. Paste that URL + the token into the app: Admin → Head-office submission → Save → Test.
 *
 * RE-DEPLOYING AFTER AN EDIT: Deploy → Manage deployments → edit (pencil) → Version: New version
 * → Deploy. This keeps the SAME /exec URL. Creating a *new* deployment gives a new URL and every
 * installed app would have to be re-pointed.
 *
 * SECURITY NOTE: SHARED_TOKEN is not a password — anyone holding the app can read it. It keeps
 * stray or accidental posts out, nothing more. The endpoint only ever appends, so the worst a
 * leaked token allows is junk rows, never deletion or reading back other branches' audits.
 */

var SHARED_TOKEN = 'CHANGE-ME';                        // must match the token in the app
var DRIVE_FOLDER = 'Flame On — Audit submissions';     // created on first submission
var SHEET_AUDITS = 'Audits';
var SHEET_FINDINGS = 'Findings';
var KEEP_PHOTOS = true;                                // false = ignore photos, sheet rows only

var AUDIT_HEADERS = [
  'Received (PKT)', 'Audit ID', 'Branch', 'Audit type', 'Date', 'Shift',
  'Score %', 'Grade', 'Tier', 'Auto-fail', 'Findings', 'Open CAPAs', 'Completion %',
  'Food safety %', 'Stops', 'Fail reasons', 'Auditor', 'Designation', 'Items sampled',
  'Profile', 'Photos', 'Q-set', 'App build', 'Completed (PKT)', 'Amendment', 'Superseded by',
  'Full record (Drive)', 'Device'
];
var FINDING_HEADERS = [
  'Received (PKT)', 'Audit ID', 'Branch', 'Audit type', 'Date', 'Section', 'Question',
  'Critical', 'Auditor note', 'Root cause', 'Corrective action', 'Owner', 'Due', 'CAPA status'
];

/** Browser sanity check — visiting the /exec URL should show this. */
function doGet() {
  return json({
    ok: true,
    msg: 'Flame On audit receiver is live. Audits are POSTed here by the app.',
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, error: 'empty request' });

    var p;
    try { p = JSON.parse(e.postData.contents); }
    catch (err) { return json({ ok: false, error: 'could not read the submission (bad JSON)' }); }

    if (SHARED_TOKEN && String(p.token || '') !== SHARED_TOKEN) {
      return json({ ok: false, error: 'token does not match head office' });
    }
    if (p.ping) {
      return json({ ok: true, msg: 'connected', sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
    }

    var s = p.summary || {};
    var rec = p.record || {};
    if (!s.id || !s.branch) return json({ ok: false, error: 'submission is missing its audit id or branch' });

    // One writer at a time: two auditors completing at the same moment must not race for a row.
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var received = stampPKT();
      var stored = storeRecord(p, s, received);   // Drive JSON + photos; '' if Drive is unavailable

      writeAuditRow(ss, s, p, received, stored);
      writeFindingRows(ss, s, rec, received);

      return json({ ok: true, ref: s.id, msg: 'stored', sheet: ss.getName() });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    // Surfaced verbatim in the auditor's error dialog, so keep it human.
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------------- sheet writes ---------------- */

function sheetFor(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * Upsert by audit ID. A re-send (bad signal, or an auditor tapping Re-send) must correct the
 * existing row rather than leaving head office with two rows for one audit.
 */
function writeAuditRow(ss, s, p, received, driveUrl) {
  var sh = sheetFor(ss, SHEET_AUDITS, AUDIT_HEADERS);
  var row = [
    received, s.id, s.branch, s.typeLabel || s.type, s.date, s.shift,
    s.score, s.grade, s.tier, s.fail ? 'YES' : '', s.findings, s.capaOpen, s.completion,
    s.safety, s.stops, s.failReasons, s.by, s.designation, s.item,
    s.profile, s.photos, s.qsVersion, s.appBuild, s.completedAt,
    s.amended ? 'YES' : '', s.supersededBy, driveUrl, p.device || ''
  ].map(cell);

  var ids = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues() : [];
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(s.id)) {
      sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sh.appendRow(row);
}

/** One row per failed line, with its corrective action — the register head office actually chases. */
function writeFindingRows(ss, s, rec, received) {
  var sh = sheetFor(ss, SHEET_FINDINGS, FINDING_HEADERS);

  // A re-sent audit replaces its own earlier findings instead of duplicating them.
  if (sh.getLastRow() > 1) {
    var idCol = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
    for (var r = idCol.length - 1; r >= 0; r--) {
      if (String(idCol[r][0]) === String(s.id)) sh.deleteRow(r + 2);
    }
  }

  var secs = (rec.snapshot && rec.snapshot.sections) || [];
  var items = rec.items || {};
  var capa = rec.capa || {};
  var rows = [];

  secs.forEach(function (sec) {
    (sec.checks || []).forEach(function (ch) {
      var key = sec.id + '||' + ch.id;
      var it = items[key];
      if (!it || it.a !== 'no') return;
      var cp = capa[key] || {};
      rows.push([
        received, s.id, s.branch, s.typeLabel || s.type, s.date, sec.name, ch.q,
        ch.crit ? 'CRITICAL' : '', it.note || '',
        cp.cause || '', cp.action || '', cp.owner || '', cp.deadline || '', cp.status || ''
      ].map(cell));
    });
  });

  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, FINDING_HEADERS.length).setValues(rows);
}

/* ---------------- Drive ---------------- */

function storeRecord(p, s, received) {
  try {
    var root = folder(DRIVE_FOLDER, null);
    var branchDir = folder(String(s.branch || 'Unknown'), root);
    var base = [s.date || 'nodate', s.type || '', String(s.branch || '').replace(/[\\/]/g, '-'), s.id].join('_');

    branchDir.createFile(base + '.json', JSON.stringify(p, null, 2), MimeType.PLAIN_TEXT);

    if (KEEP_PHOTOS && p.photos && p.photos.length) {
      var photoDir = folder(base + '_photos', branchDir);
      p.photos.forEach(function (ph, i) {
        try {
          var m = /^data:([^;]+);base64,(.*)$/.exec(ph.dataUrl || '');
          if (!m) return;
          var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], base + '_' + (i + 1) + extFor(m[1]));
          photoDir.createFile(blob);
        } catch (err) { /* one bad photo must not fail the audit */ }
      });
    }
    return branchDir.getUrl();
  } catch (err) {
    // Drive quota/permission trouble must not lose the audit — the sheet row is the record.
    return 'not filed: ' + String((err && err.message) || err);
  }
}

function folder(name, parent) {
  var it = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function extFor(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

/* ---------------- helpers ---------------- */

/** Text-leading apostrophe blocks Sheets from evaluating a note that starts with = or +. */
function cell(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  return /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? "'" + s : s;
}

function stampPKT() {
  return Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyyy-MM-dd HH:mm') + ' PKT';
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
