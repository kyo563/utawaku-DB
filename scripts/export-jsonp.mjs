#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const PRIMARY_KIND_PRIORITY = ['歌ってみた', '歌枠', 'ショート'];
const CALLBACK = '__UTAWAKU_DB_JSONP__';
const VERSION = 1;

function parseArgs(argv) {
  const args = {
    input: '',
    inputSongs: '',
    inputArchive: '',
    out: 'public-data',
    chunkSize: 1000
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--input-songs') args.inputSongs = argv[++i];
    else if (a === '--input-archive') args.inputArchive = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--chunk-size') args.chunkSize = Number(argv[++i]);
  }

  if (!args.input && !args.inputSongs && !args.inputArchive) {
    args.input = 'tmp/spreadsheet-export.json';
  }

  if (!Number.isInteger(args.chunkSize) || args.chunkSize < 1) {
    throw new Error('chunk-size must be integer >= 1');
  }
  return args;
}

function readKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.keys(obj);
}

function toDiagnostic(label, src) {
  const topKeys = readKeys(src);
  const dataKeys = readKeys(src?.data);
  const sheetsKeys = readKeys(src?.sheets || src?.data?.sheets);
  return `${label} topLevelKeys=[${topKeys.join(',') || '-'}] dataKeys=[${dataKeys.join(',') || '-'}] sheetsKeys=[${sheetsKeys.join(',') || '-'}]`;
}

function normalizeExportPayload(src, label) {
  if (!src || typeof src !== 'object') {
    throw new Error(`invalid payload: ${label} (not object)`);
  }
  if (src.ok === false) {
    const diag = toDiagnostic(label, src);
    throw new Error(`payload error: ${label} mode=${String(src.mode || '')} error=${String(src.error || 'unknown')} ${diag}`);
  }

  const payload = src.sheets ? src : (src.data?.sheets ? src.data : null);
  if (!payload?.sheets) {
    const diag = toDiagnostic(label, src);
    throw new Error(`target sheets not found: ${diag}`);
  }
  return payload;
}

function pickSheet(payload, candidates) {
  for (const key of candidates) {
    const sheet = payload?.sheets?.[key];
    if (sheet) return sheet;
  }
  return null;
}

function parseDate8FromTitle(sourceTitle) {
  const m = String(sourceTitle || '').match(/^(\d{8})/);
  if (!m) return { publishedDate8: '', publishedDate: '' };
  const d8 = m[1];
  return { publishedDate8: d8, publishedDate: `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}` };
}

function parseYouTube(sourceUrl) {
  const text = String(sourceUrl || '');
  let videoId = '';
  try {
    const u = new URL(text);
    if (u.hostname.includes('youtu.be')) videoId = u.pathname.replace(/^\//, '');
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') videoId = u.searchParams.get('v') || '';
      if (u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/')[2] || '';
      if (u.pathname.startsWith('/live/')) videoId = u.pathname.split('/')[2] || '';
    }
    const ts = u.searchParams.get('t') || u.searchParams.get('start') || '';
    const n = Number(String(ts).replace(/s$/i, ''));
    return {
      youtubeVideoId: videoId || '',
      timestampRaw: ts || '',
      timestampSeconds: Number.isFinite(n) && n >= 0 ? n : null
    };
  } catch {
    return { youtubeVideoId: '', timestampRaw: '', timestampSeconds: null };
  }
}

function normalizeRecord(raw, sourceSheet, sourceSheetLabel) {
  const artist = String(raw.artist || '').trim();
  const title = String(raw.title || '').trim();
  const tagsRaw = String(raw.tagsRaw || '').trim();
  const tags = tagsRaw.split(',').map((x) => x.trim()).filter(Boolean);
  const primaryKind = tags.find((x) => PRIMARY_KIND_PRIORITY.includes(x)) || '';
  const sourceTitle = String(raw.sourceTitle || '').trim();
  const sourceUrl = String(raw.sourceUrl || '').trim();
  const { publishedDate8, publishedDate } = parseDate8FromTitle(sourceTitle);
  const yt = parseYouTube(sourceUrl);
  const rowNumber = Number(raw.rowNumber) || null;
  const sameSongKey = `${artist}\u001f${title}`;
  const h = createHash('sha1').update(`${artist}|${title}|${sourceUrl}`).digest('hex').slice(0, 12);
  const rowId = `${sourceSheet}|${rowNumber ?? 0}|${h}`;

  return {
    sourceSheet,
    sourceSheetLabel,
    artist,
    title,
    tagsRaw,
    tags,
    primaryKind,
    sourceTitle,
    sourceUrl,
    publishedDate8,
    publishedDate,
    youtubeVideoId: yt.youtubeVideoId,
    timestampRaw: yt.timestampRaw,
    timestampSeconds: yt.timestampSeconds,
    sameSongKey,
    rowNumber,
    rowId
  };
}

function validateHeader(header) {
  const expected = ['アーティスト名', '曲名', '区分', '出典元情報(直リンク)'];
  return expected.every((h, i) => String(header?.[i] || '').trim() === h);
}

function validate(recordsSongs, recordsArchive, warnings) {
  const all = [...recordsSongs, ...recordsArchive];
  const urlSet = new Set();
  const songKeySet = new Set();

  for (const r of all) {
    if (!r.primaryKind) warnings.push(`primary kind missing: ${r.rowId}`);
    if (!r.publishedDate8) warnings.push(`sourceTitle date8 missing: ${r.rowId}`);
    if (!r.sourceUrl) warnings.push(`sourceUrl missing: ${r.rowId}`);
    if (r.sourceUrl) {
      if (urlSet.has(r.sourceUrl)) warnings.push(`duplicate sourceUrl: ${r.sourceUrl}`);
      urlSet.add(r.sourceUrl);
    }
  }

  for (const r of recordsSongs) {
    if (songKeySet.has(r.sameSongKey)) warnings.push(`songs duplicate sameSongKey: ${r.sameSongKey}`);
    songKeySet.add(r.sameSongKey);
  }
}

function toJsonp(payload) {
  return `${CALLBACK}(${JSON.stringify(payload)});\n`;
}

async function writeJson(file, payload) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function writeJsonp(file, payload) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, toJsonp(payload), 'utf8');
}

async function loadNormalized(file, label) {
  const text = await readFile(file, 'utf8');
  let src;
  try {
    src = JSON.parse(text);
  } catch (err) {
    const preview = text.slice(0, 600).replace(/\s+/g, ' ');
    throw new Error(`invalid json: ${label} file=${file} preview=${preview} parseError=${String(err && err.message ? err.message : err)}`);
  }
  return normalizeExportPayload(src, label);
}

function resolveSheets(combinedPayload, songsPayload, archivePayload) {
  const songsSheet = (songsPayload && pickSheet(songsPayload, ['歌った曲リスト', 'songs']))
    || (combinedPayload && pickSheet(combinedPayload, ['歌った曲リスト', 'songs']));
  const archiveSheet = (archivePayload && pickSheet(archivePayload, ['アーカイブシート', 'archive']))
    || (combinedPayload && pickSheet(combinedPayload, ['アーカイブシート', 'archive']));

  if (!songsSheet || !archiveSheet) {
    throw new Error('target sheets not found: required songs and archive sheets');
  }
  return { songsSheet, archiveSheet };
}

async function main() {
  const args = parseArgs(process.argv);

  const combinedPayload = args.input ? await loadNormalized(args.input, 'combined') : null;
  const songsPayload = args.inputSongs ? await loadNormalized(args.inputSongs, 'songs') : null;
  const archivePayload = args.inputArchive ? await loadNormalized(args.inputArchive, 'archive') : null;

  const { songsSheet, archiveSheet } = resolveSheets(combinedPayload, songsPayload, archivePayload);

  const generatedAt = songsPayload?.generatedAt
    || archivePayload?.generatedAt
    || combinedPayload?.generatedAt
    || new Date().toISOString();

  if (!validateHeader(songsSheet.header) || !validateHeader(archiveSheet.header)) {
    throw new Error('A3:D3 header mismatch');
  }

  const songs = (songsSheet.rows || []).map((r) => normalizeRecord(r, 'songs', songsSheet.sourceSheetLabel || '歌った曲リスト'));
  const archive = (archiveSheet.rows || []).map((r) => normalizeRecord(r, 'archive', archiveSheet.sourceSheetLabel || 'アーカイブシート'));

  const warnings = [];
  validate(songs, archive, warnings);

  const songsPayloadOut = {
    type: 'songs',
    version: VERSION,
    generatedAt,
    count: songs.length,
    records: songs
  };

  await writeJson(join(args.out, 'songs.json'), songsPayloadOut);
  await writeJsonp(join(args.out, 'songs.js'), songsPayloadOut);

  const chunks = [];
  for (let i = 0; i < archive.length; i += args.chunkSize) {
    const index = Math.floor(i / args.chunkSize) + 1;
    const records = archive.slice(i, i + args.chunkSize);
    const chunkName = `archive-${String(index).padStart(4, '0')}`;
    const jsonPath = `public-data/archive/chunks/${chunkName}.json`;
    const jsonpPath = `public-data/archive-chunks/${chunkName}.js`;
    chunks.push({ path: jsonPath, jsonpPath, index, count: records.length });

    const chunkPayload = {
      type: 'archive-chunk',
      version: VERSION,
      generatedAt,
      chunkIndex: index,
      count: records.length,
      records
    };

    await writeJson(join(args.out, `archive/chunks/${chunkName}.json`), chunkPayload);
    await writeJsonp(join(args.out, `archive-chunks/${chunkName}.js`), chunkPayload);
  }

  const archiveIndexPayload = {
    type: 'archive-index',
    version: VERSION,
    generatedAt,
    totalCount: archive.length,
    chunkSize: args.chunkSize,
    chunks
  };

  await writeJson(join(args.out, 'archive/index.json'), archiveIndexPayload);
  await writeJsonp(join(args.out, 'archive-manifest.js'), {
    type: 'archive-manifest',
    version: VERSION,
    generatedAt,
    totalCount: archive.length,
    chunkSize: args.chunkSize,
    chunks: chunks.map((x) => ({ path: x.jsonpPath, index: x.index, count: x.count }))
  });

  if (warnings.length > 0) {
    await writeFile(join(args.out, 'validation-warnings.json'), `${JSON.stringify({ warnings }, null, 2)}\n`, 'utf8');
    console.warn(`warnings: ${warnings.length}`);
  } else {
    await writeFile(join(args.out, 'validation-warnings.json'), '{"warnings":[]}\n', 'utf8');
  }

  console.log(`generated songs=${songs.length} archive=${archive.length} chunks=${chunks.length}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
