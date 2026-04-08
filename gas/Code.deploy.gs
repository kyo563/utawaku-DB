/**
 * Spreadsheet -> JSONP export (contract v1.1)
 *
 * このファイルをそのまま GAS に貼り付けてデプロイする想定。
 *
 * Endpoint:
 *   GET /exec?mode=exportContractV1&callback=yourCallback
 *
 * Response:
 *   - callback 未指定: JSON
 *   - callback 指定: JSONP
 */

var EXPORT_MODE = 'exportContractV1';
var TARGET_SHEETS = [
  { label: '歌った曲リスト', key: 'songs' },
  { label: 'アーカイブシート', key: 'archive' }
];
var EXPECTED_HEADER = [
  'アーティスト名',
  '曲名',
  '区分',
  '出典元情報(直リンク)'
];

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var mode = String(p.mode || EXPORT_MODE);
  if (mode !== EXPORT_MODE) {
    return asOutput_(JSON.stringify({ ok: false, error: 'unsupported mode: ' + mode }), p.callback);
  }

  var payload = buildExportContractV1_();
  return asOutput_(JSON.stringify(payload), p.callback);
}

function buildExportContractV1_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('active spreadsheet not found');
  }

  var result = {
    ok: true,
    version: 'v1.1',
    spreadsheetId: ss.getId(),
    generatedAt: new Date().toISOString(),
    sheets: {},
    warnings: []
  };

  var urlSeen = {};

  for (var i = 0; i < TARGET_SHEETS.length; i++) {
    var t = TARGET_SHEETS[i];
    var sheetResult = readSheet_(ss, t.label, t.key, urlSeen, result.warnings);
    result.sheets[t.label] = sheetResult;
  }

  return result;
}

function readSheet_(ss, sheetLabel, sourceSheetKey, urlSeen, warnings) {
  var sh = ss.getSheetByName(sheetLabel);
  if (!sh) {
    throw new Error('sheet not found: ' + sheetLabel);
  }

  var header = sh.getRange(3, 1, 1, 4).getDisplayValues()[0];
  validateHeader_(header, sheetLabel, warnings);

  var lastRow = sh.getLastRow();
  var rows = [];

  if (lastRow >= 4) {
    var rowCount = lastRow - 3;
    var values = sh.getRange(4, 1, rowCount, 4).getDisplayValues();
    var richLinks = sh.getRange(4, 4, rowCount, 1).getRichTextValues();

    for (var i = 0; i < rowCount; i++) {
      var rowNumber = i + 4;
      var artist = normalizeText_(values[i][0]);
      var title = normalizeText_(values[i][1]);
      var tagsRaw = normalizeText_(values[i][2]);
      var sourceTitle = normalizeText_(values[i][3]);
      var sourceUrl = extractLinkUrl_(richLinks[i][0]);

      if (!artist && !title && !tagsRaw && !sourceTitle && !sourceUrl) {
        continue;
      }

      if (!sourceUrl) {
        warnings.push('missing sourceUrl: ' + sheetLabel + '!D' + rowNumber);
      } else if (urlSeen[sourceUrl]) {
        warnings.push('duplicate sourceUrl: ' + sourceUrl + ' at ' + sheetLabel + '!D' + rowNumber);
      } else {
        urlSeen[sourceUrl] = true;
      }

      rows.push({
        rowNumber: rowNumber,
        sourceSheet: sourceSheetKey,
        sourceSheetLabel: sheetLabel,
        artist: artist,
        title: title,
        tagsRaw: tagsRaw,
        sourceTitle: sourceTitle,
        sourceUrl: sourceUrl
      });
    }
  }

  return {
    sourceSheet: sourceSheetKey,
    sourceSheetLabel: sheetLabel,
    headerRowNumber: 3,
    header: header,
    rows: rows
  };
}

function validateHeader_(header, sheetLabel, warnings) {
  for (var i = 0; i < EXPECTED_HEADER.length; i++) {
    var expected = EXPECTED_HEADER[i];
    var actual = normalizeText_(header[i]);
    if (actual !== expected) {
      warnings.push('header mismatch at ' + sheetLabel + ' col ' + (i + 1) + ': expected="' + expected + '", actual="' + actual + '"');
    }
  }
}

function extractLinkUrl_(richTextValue) {
  if (!richTextValue || !richTextValue.getLinkUrl) return '';
  return String(richTextValue.getLinkUrl() || '').trim();
}

function normalizeText_(v) {
  return String(v || '').trim();
}

function asOutput_(json, callback) {
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
