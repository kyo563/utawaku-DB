import { APP_CONFIG } from "./config.js";
import { dedupeByKey, extractDate8, extractVideoId, normalizeText, stableRowId, toDisplayDate, toTimestampSeconds } from "./utils.js";

function readMeta(name, fallback = "") {
  const el = document.querySelector(`meta[name="${name}"]`);
  return (el?.content || fallback).trim();
}

function toBooleanMeta(name, fallback = false) {
  const v = readMeta(name, fallback ? "true" : "false").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`fetch failed: ${url}`);
  return res.json();
}

function normalizeRecord(input, i, sourceType) {
  const artist = String(input.artist || "").trim();
  const title = String(input.title || "").trim();
  const kind = String(input.kind || input.primaryKind || "歌枠").trim();
  const dText = String(input.dText || input.sourceTitle || input.date || "").trim();
  const dUrl = String(input.dUrl || input.sourceUrl || input.url || "").trim();
  const date8 = String(input.date8 || input.publishedDate8 || extractDate8(dText)).replace(/\D/g, "").slice(0, 8);

  return {
    artist,
    title,
    kind,
    dText,
    dUrl,
    date8,
    rowId: String(input.rowId || stableRowId(input, i)),
    displayDate: toDisplayDate(date8),
    timestampSeconds: toTimestampSeconds(dUrl, dText),
    videoId: extractVideoId(dUrl),
    sourceType,
    normalizedArtist: normalizeText(artist),
    normalizedTitle: normalizeText(title)
  };
}

function unwrapRecords(data) {
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeRows(songsData, archiveData, sourceType) {
  const merged = unwrapRecords(songsData).concat(unwrapRecords(archiveData));
  return merged.map((row, i) => normalizeRecord(row, i, sourceType));
}

async function loadArchiveRowsFromIndex(archiveIndexUrl) {
  const indexData = await fetchJson(archiveIndexUrl);
  const chunks = Array.isArray(indexData?.chunks) ? indexData.chunks : [];
  if (chunks.length === 0) return [];

  const initialCount = Math.max(1, Number(APP_CONFIG.archiveInitialChunkCount) || 1);
  const targets = chunks.slice(0, initialCount);
  const loaded = await Promise.all(targets.map((c) => fetchJson(c.path || c.url || "")));
  return loaded.flatMap((x) => unwrapRecords(x));
}

async function loadFromStatic() {
  const songsUrl = readMeta("utawaku:data-songs", "./public-data/songs.json");
  const archiveIndexUrl = readMeta("utawaku:data-archive-index", "./public-data/archive/index.json");

  const songs = await fetchJson(songsUrl);
  const archiveRows = await loadArchiveRowsFromIndex(archiveIndexUrl);

  return normalizeRows(songs, archiveRows, "static-json");
}

async function loadFromGas() {
  const endpoint = readMeta("utawaku:gas-endpoint");
  if (!endpoint) throw new Error("gas endpoint not configured");

  const joiner = endpoint.includes("?") ? "&" : "?";
  const songsUrl = `${endpoint}${joiner}mode=songs&limit=${APP_CONFIG.fallbackLimit}`;
  const archiveUrl = `${endpoint}${joiner}mode=archive&limit=${APP_CONFIG.fallbackLimit}`;
  const [songsData, archiveData] = await Promise.all([fetchJson(songsUrl), fetchJson(archiveUrl)]);

  return normalizeRows(songsData?.data || songsData, archiveData?.data || archiveData, "gas-api");
}

function buildLoadError(staticError, gasError) {
  return `データ読込に失敗しました。static=${staticError.message} / gas=${gasError.message}`;
}

export async function loadSongsWithFallback() {
  try {
    const rows = dedupeByKey(await loadFromStatic());
    return { rows, sourceType: "static-json", error: "" };
  } catch (staticError) {
    const allowGasFallback = toBooleanMeta("utawaku:allow-gas-fallback", false);
    if (!allowGasFallback) {
      return {
        rows: [],
        sourceType: "",
        error: `データ読込に失敗しました。static=${staticError.message} / gas=disabled`
      };
    }

    try {
      const rows = dedupeByKey(await loadFromGas());
      return { rows, sourceType: "gas-api", error: "" };
    } catch (gasError) {
      return {
        rows: [],
        sourceType: "",
        error: buildLoadError(staticError, gasError)
      };
    }
  }
}
