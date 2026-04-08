import { APP_CONFIG } from "./config.js";
import { dedupeByKey, extractDate8, extractVideoId, normalizeText, stableRowId, toDisplayDate, toTimestampSeconds } from "./utils.js";

function readMeta(name, fallback = "") {
  const el = document.querySelector(`meta[name=\"${name}\"]`);
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

async function loadFromStatic() {
  const songsUrl = readMeta("utawaku:data-songs", "./public-data/songs.json");
  const data = await fetchJson(songsUrl);
  if (!Array.isArray(data)) throw new Error("songs.json must be array");
  return data.map((r, i) => normalizeRecord(r, i, "static-json"));
}

async function loadFromGas() {
  const endpoint = readMeta("utawaku:gas-endpoint");
  if (!endpoint) throw new Error("gas endpoint not configured");
  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}sheet=songs&limit=${APP_CONFIG.fallbackLimit}`;
  const data = await fetchJson(url);
  const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return rows.map((r, i) => normalizeRecord(r, i, "gas-api"));
}

export async function loadSongsWithFallback() {
  try {
    const rows = dedupeByKey(await loadFromStatic());
    return { rows, sourceType: "static-json", error: "" };
  } catch (e1) {
    try {
      const rows = dedupeByKey(await loadFromGas());
      return { rows, sourceType: "gas-api", error: "" };
    } catch (e2) {
      return {
        rows: [],
        sourceType: "",
        error: `データ読込に失敗しました。static=${e1.message} / gas=${e2.message}`
      };
    }
  }
}
