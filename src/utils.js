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

export function toTimestampSeconds(url, dText) {
  const source = `${url || ""} ${dText || ""}`;
  const secMatch = source.match(/[?&]t=(\d+)/);
  if (secMatch) return Number(secMatch[1]);
  const hmsMatch = source.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!hmsMatch) return 0;
  const a = Number(hmsMatch[1]);
  const b = Number(hmsMatch[2]);
  const c = Number(hmsMatch[3] || 0);
  return hmsMatch[3] ? a * 3600 + b * 60 + c : a * 60 + b;
}

export function extractVideoId(url) {
  const text = String(url || "");
  const yt = text.match(/[?&]v=([\w-]{6,})/);
  if (yt) return yt[1];
  const youtu = text.match(/youtu\.be\/([\w-]{6,})/);
  if (youtu) return youtu[1];
  return "";
}

export function stableRowId(item, i) {
  if (item.rowId) return String(item.rowId);
  const core = [item.artist, item.title, item.kind, item.date8].map((v) => String(v || "").trim()).join("|");
  return `row-${core || i}-${i}`;
}

export function dedupeByKey(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = [item.artist, item.title, item.kind, item.date8, item.dUrl].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
