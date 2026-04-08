#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const PRIMARY_KIND_PRIORITY = ['歌ってみた', '歌枠', 'ショート'];
const CALLBACK = '__UTAWAKU_DB_JSONP__';
const VERSION = 1;

function parseArgs(argv) {
  const args = { input: 'tmp/spreadsheet-export.json', out: 'public-data', chunkSize: 1000 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--chunk-size') args.chunkSize = Number(argv[++i]);
  }
  if (!Number.isInteger(args.chunkSize) || args.chunkSize < 1) {
    throw new Error('chunk-size must be integer >= 1');
  }
  return args;
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

async function writeJsonp(file, payload) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, toJsonp(payload), 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  const rawText = await readFile(args.input, 'utf8');
  const src = JSON.parse(rawText);
  const generatedAt = src.generatedAt || new Date().toISOString();

  const songsSheet = src.sheets?.['歌った曲リスト'];
  const archiveSheet = src.sheets?.['アーカイブシート'];
  if (!songsSheet || !archiveSheet) throw new Error('target sheets not found');
  if (!validateHeader(songsSheet.header) || !validateHeader(archiveSheet.header)) {
    throw new Error('A3:D3 header mismatch');
  }

  const songs = (songsSheet.rows || []).map((r) => normalizeRecord(r, 'songs', '歌った曲リスト'));
  const archive = (archiveSheet.rows || []).map((r) => normalizeRecord(r, 'archive', 'アーカイブシート'));

  const warnings = [];
  validate(songs, archive, warnings);

  await writeJsonp(join(args.out, 'songs.js'), {
    type: 'songs',
    version: VERSION,
    generatedAt,
    count: songs.length,
    records: songs
  });

  const chunks = [];
  for (let i = 0; i < archive.length; i += args.chunkSize) {
    const index = Math.floor(i / args.chunkSize) + 1;
    const records = archive.slice(i, i + args.chunkSize);
    const path = `public-data/archive-chunks/archive-${String(index).padStart(4, '0')}.js`;
    chunks.push({ path, index, count: records.length });

    await writeJsonp(join(args.out, `archive-chunks/archive-${String(index).padStart(4, '0')}.js`), {
      type: 'archive-chunk',
      version: VERSION,
      generatedAt,
      chunkIndex: index,
      count: records.length,
      records
    });
  }

  await writeJsonp(join(args.out, 'archive-manifest.js'), {
    type: 'archive-manifest',
    version: VERSION,
    generatedAt,
    totalCount: archive.length,
    chunkSize: args.chunkSize,
    chunks
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
