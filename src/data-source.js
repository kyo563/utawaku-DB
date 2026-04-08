import { APP_CONFIG } from "./config.js";
import { dedupeByKey, extractDate8, extractVideoId, normalizeText, stableRowId, toDisplayDate, toTimestampSeconds } from "./utils.js";

function readMeta(name, fallback = "") {
  const el = document.querySelector(`meta[name="${name}"]`);
  return (el?.content || fallback).trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`fetch failed: ${url}`);
  return res.json();
}

function normalizeRecord(input, i, sourceType) {
  const artist = String(input.artist || "").trim();
  const title = String(input.title || "").trim();
  const kind = String(input.kind || "歌枠").trim();
  const dText = String(input.dText || input.date || "").trim();
  const dUrl = String(input.dUrl || input.url || "").trim();
  const date8 = String(input.date8 || extractDate8(dText)).replace(/\D/g, "").slice(0, 8);

  return {
    artist,
    title,
    kind,
    dText,
    dUrl,
    date8,
    rowId: stableRowId(input, i),
    displayDate: toDisplayDate(date8),
    timestampSeconds: toTimestampSeconds(dUrl, dText),
    videoId: extractVideoId(dUrl),
    sourceType,
    normalizedArtist: normalizeText(artist),
    normalizedTitle: normalizeText(title)
  };
}

function unwrapItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeRows(songsData, archiveData, sourceType) {
  const merged = unwrapItems(songsData).concat(unwrapItems(archiveData));
  return merged.map((row, i) => normalizeRecord(row, i, sourceType));
}

async function loadFromStatic() {
  const songsUrl = readMeta("utawaku:data-songs", "./public-data/songs.json");
  const archiveUrl = readMeta("utawaku:data-archive", "./public-data/archive.json");
  const [songs, archive] = await Promise.all([fetchJson(songsUrl), fetchJson(archiveUrl)]);

  if (!Array.isArray(songs)) throw new Error("songs.json must be array");
  if (!Array.isArray(archive)) throw new Error("archive.json must be array");

  return normalizeRows(songs, archive, "static-json");
}

async function loadFromGas() {
  const endpoint = readMeta("utawaku:gas-endpoint");
  if (!endpoint) throw new Error("gas endpoint not configured");

  const joiner = endpoint.includes("?") ? "&" : "?";
  const songsUrl = `${endpoint}${joiner}sheet=songs&limit=${APP_CONFIG.fallbackLimit}`;
  const archiveUrl = `${endpoint}${joiner}sheet=archive&limit=${APP_CONFIG.fallbackLimit}`;
  const [songsData, archiveData] = await Promise.all([fetchJson(songsUrl), fetchJson(archiveUrl)]);

  return normalizeRows(songsData, archiveData, "gas-api");
}

function buildLoadError(staticError, gasError) {
  return `データ読込に失敗しました。static=${staticError.message} / gas=${gasError.message}`;
}

export async function loadSongsWithFallback() {
  try {
    const rows = dedupeByKey(await loadFromStatic());
    return { rows, sourceType: "static-json", error: "" };
  } catch (staticError) {
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
