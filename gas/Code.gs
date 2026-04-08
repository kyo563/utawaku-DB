/**
 * Utawaku-DB: Spreadsheet export API。
 *
 * GET /exec?mode=exportContractV1
 * GET /exec?mode=songs
 * GET /exec?mode=archive
 */
var EXPORT_MODE = 'exportContractV1';
var MODE_SONGS = 'songs';
var MODE_ARCHIVE = 'archive';

function doGet(e) {
  var p = e && e.parameter ? e.parameter : {};
  var mode = String(p.mode || EXPORT_MODE);

  if (mode !== EXPORT_MODE && mode !== MODE_SONGS && mode !== MODE_ARCHIVE) {
    return asOutput_(JSON.stringify({ ok: false, mode: mode, error: 'unsupported mode' }), p.callback);
  }

  try {
    var payload = buildExportContractV1_(mode);
    return asOutput_(JSON.stringify({ ok: true, mode: mode, data: payload }), p.callback);
  } catch (err) {
    return asOutput_(JSON.stringify({ ok: false, mode: mode, error: String(err && err.message ? err.message : err) }), p.callback);
  }
}

function buildExportContractV1_(mode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var target = [
    { label: '歌った曲リスト', key: 'songs' },
    { label: 'アーカイブシート', key: 'archive' }
  ];

  var result = {
    ok: true,
    version: 'v1.2',
    spreadsheetId: ss.getId(),
    generatedAt: new Date().toISOString(),
    sheets: {}
  };

  for (var i = 0; i < target.length; i++) {
    var t = target[i];
    if (mode === MODE_SONGS && t.key !== MODE_SONGS) continue;
    if (mode === MODE_ARCHIVE && t.key !== MODE_ARCHIVE) continue;

    var sh = ss.getSheetByName(t.label);
    if (!sh) throw new Error('sheet not found: ' + t.label);

    var lastRow = sh.getLastRow();
    var lastCol = Math.max(4, sh.getLastColumn());
    var header = sh.getRange(3, 1, 1, 4).getDisplayValues()[0];

    var rows = [];
    if (lastRow >= 4) {
      var rowCount = lastRow - 3;
      var values = sh.getRange(4, 1, rowCount, lastCol).getDisplayValues();
      var rich = sh.getRange(4, 4, rowCount, 1).getRichTextValues();
      for (var r = 0; r < values.length; r++) {
        var artist = String(values[r][0] || '').trim();
        var title = String(values[r][1] || '').trim();
        var tagsRaw = String(values[r][2] || '').trim();
        var sourceTitle = String(values[r][3] || '').trim();
        var rt = rich[r][0];
        var sourceUrl = rt && rt.getLinkUrl ? (rt.getLinkUrl() || '') : '';

        if (!artist && !title && !tagsRaw && !sourceTitle && !sourceUrl) continue;
        rows.push({
          rowNumber: r + 4,
          artist: artist,
          title: title,
          tagsRaw: tagsRaw,
          sourceTitle: sourceTitle,
          sourceUrl: sourceUrl
        });
      }
    }

    var sheetResult = {
      sourceSheet: t.key,
      sourceSheetLabel: t.label,
      headerRowNumber: 3,
      header: header,
      rows: rows
    };

    result.sheets[t.label] = sheetResult;
    result.sheets[t.key] = sheetResult;
  }

  return result;
}

function asOutput_(json, callback) {
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
