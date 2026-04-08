/**
 * Utawaku-DB 用 GAS API
 * - /exec?sheet=songs|gags|archive
 * - q / artist / title / exact / limit / offset
 * - callback 指定時は JSONP
 */
function doGet(e) {
  var p = e && e.parameter ? e.parameter : {};
  var cacheKey = "utawaku:" + JSON.stringify(p);
  var cache = CacheService.getScriptCache();
  var hit = cache.get(cacheKey);
  if (hit) return asOutput_(hit, p.callback);

  var sheetName = (p.sheet || "songs").toLowerCase();
  var allow = { songs: true, gags: true, archive: true };
  if (!allow[sheetName]) return asJson_({ ok: false, error: "invalid sheet" }, p.callback);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return asJson_({ ok: false, error: "sheet not found" }, p.callback);

  var values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return asJson_({ ok: true, sheet: sheetName, total: 0, items: [] }, p.callback);

  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = values.slice(1).map(function (row, i) {
    var obj = {};
    headers.forEach(function (h, idx) { obj[h] = row[idx] || ""; });

    var dText = obj.dText || obj.date || "";
    var dUrl = extractUrl_(obj.dUrl || obj.url || "");
    var artist = String(obj.artist || "").trim();
    var title = String(obj.title || "").trim();
    var kind = String(obj.kind || "歌枠").trim();
    var date8 = obj.date8 || extractDate8_(dText);

    return {
      artist: artist,
      title: title,
      kind: kind,
      dText: dText,
      dUrl: dUrl,
      date8: date8,
      rowId: obj.rowId || [sheetName, i + 2, artist, title, date8].join("|")
    };
  });

  var filtered = filterRows_(rows, p);
  var deduped = dedupeRows_(filtered);
  var offset = Math.max(0, Number(p.offset || 0));
  var limit = Math.max(1, Math.min(500, Number(p.limit || 100)));
  var items = deduped.slice(offset, offset + limit);

  var payload = JSON.stringify({
    ok: true,
    sheet: sheetName,
    total: deduped.length,
    limit: limit,
    offset: offset,
    items: items
  });

  cache.put(cacheKey, payload, 120);
  return asOutput_(payload, p.callback);
}

function filterRows_(rows, p) {
  var q = normalize_(p.q || "");
  var artist = normalize_(p.artist || "");
  var title = normalize_(p.title || "");
  var exact = String(p.exact || "false") === "true";

  return rows.filter(function (r) {
    var a = normalize_(r.artist);
    var t = normalize_(r.title);
    var matchesQ = !q || a.indexOf(q) !== -1 || t.indexOf(q) !== -1;

    if (exact) {
      var okA = !artist || a === artist;
      var okT = !title || t === title;
      return matchesQ && okA && okT;
    }

    var okA2 = !artist || a.indexOf(artist) !== -1;
    var okT2 = !title || t.indexOf(title) !== -1;
    return matchesQ && okA2 && okT2;
  });
}

function dedupeRows_(rows) {
  var seen = {};
  return rows.filter(function (r) {
    var key = [r.artist, r.title, r.kind, r.date8, r.dUrl].join("|");
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function extractDate8_(text) {
  var m = String(text || "").match(/(20\d{2})[-\/.]?(\d{1,2})[-\/.]?(\d{1,2})/);
  if (!m) return "";
  return m[1] + ("0" + m[2]).slice(-2) + ("0" + m[3]).slice(-2);
}

function extractUrl_(text) {
  var s = String(text || "");
  var m = s.match(/https?:\/\/[^\s\]\)]+/);
  return m ? m[0] : s;
}

function normalize_(v) {
  return String(v || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function asJson_(obj, callback) {
  return asOutput_(JSON.stringify(obj), callback);
}

function asOutput_(json, callback) {
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
