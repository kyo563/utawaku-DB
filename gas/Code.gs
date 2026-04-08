/**
 * Utawaku-DB: Spreadsheet -> JSONP export 用の最小GAS。
 *
 * GET /exec?mode=exportContractV1
 * - 2シート（歌った曲リスト / アーカイブシート）のみを返す
 * - callback 指定時は JSONP
 */
function doGet(e) {
  var p = e && e.parameter ? e.parameter : {};
  var mode = String(p.mode || 'exportContractV1');
  if (mode !== 'exportContractV1') {
    return asOutput_(JSON.stringify({ ok: false, error: 'unsupported mode' }), p.callback);
  }

  var payload = buildExportContractV1_();
  return asOutput_(JSON.stringify(payload), p.callback);
}

function buildExportContractV1_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var target = [
    { label: '歌った曲リスト', key: 'songs' },
    { label: 'アーカイブシート', key: 'archive' }
  ];

  var result = {
    ok: true,
    version: 1,
    spreadsheetId: ss.getId(),
    generatedAt: new Date().toISOString(),
    sheets: {}
  };

  for (var i = 0; i < target.length; i++) {
    var t = target[i];
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

    result.sheets[t.label] = {
      sourceSheet: t.key,
      sourceSheetLabel: t.label,
      headerRowNumber: 3,
      header: header,
      rows: rows
    };
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
