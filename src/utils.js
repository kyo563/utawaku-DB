export function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function extractDate8(text) {
  const m = String(text || "").match(/(20\d{2})[-\/.]?(\d{1,2})[-\/.]?(\d{1,2})/);
  if (!m) return "";

  const y = m[1];
  const mo = m[2].padStart(2, "0");
  const d = m[3].padStart(2, "0");
  return `${y}${mo}${d}`;
}

export function toDisplayDate(date8) {
  if (!/^\d{8}$/.test(date8 || "")) return "日付不明";
  return `${date8.slice(0, 4)}-${date8.slice(4, 6)}-${date8.slice(6, 8)}`;
}

function parseSecondsFromQuery(source) {
  const secMatch = source.match(/[?&]t=(\d+)/);
  return secMatch ? Number(secMatch[1]) : 0;
}

function parseSecondsFromClock(source) {
  const hmsMatch = source.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!hmsMatch) return 0;

  const head = Number(hmsMatch[1]);
  const minutes = Number(hmsMatch[2]);
  const seconds = Number(hmsMatch[3] || 0);
  return hmsMatch[3] ? head * 3600 + minutes * 60 + seconds : head * 60 + minutes;
}

export function toTimestampSeconds(url, dText) {
  const source = `${url || ""} ${dText || ""}`;
  return parseSecondsFromQuery(source) || parseSecondsFromClock(source);
}

export function extractVideoId(url) {
  const text = String(url || "");
  const yt = text.match(/[?&]v=([\w-]{6,})/);
  if (yt) return yt[1];

  const youtu = text.match(/youtu\.be\/([\w-]{6,})/);
  return youtu ? youtu[1] : "";
}

export function stableRowId(item, i) {
  if (item.rowId) return String(item.rowId);
  const core = [item.artist, item.title, item.kind, item.date8].map((v) => String(v || "").trim()).join("|");
  return `row-${core || i}-${i}`;
}

function buildDedupeKey(item) {
  return [item.artist, item.title, item.kind, item.date8, item.dUrl].map((v) => String(v || "").trim()).join("|");
}

export function dedupeByKey(list) {
  const seen = new Set();

  return list.filter((item) => {
    const key = buildDedupeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
