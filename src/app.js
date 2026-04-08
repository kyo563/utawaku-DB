import { loadSongsWithFallback } from "./data-source.js";
import { fillFilters, initStaticText, renderList, renderStatus } from "./render.js";
import { createState } from "./state.js";
import { normalizeText } from "./utils.js";

const state = createState();

function refreshView() {
  applyFilterAndSort();
  renderList(state.filtered, handleCopy);
  renderStatus(`${state.filtered.length} 件表示 / source=${state.sourceType}`);
}

function applyFilterAndSort() {
  const q = normalizeText(state.query);
  const kind = state.kind;

  let rows = state.raw.filter((r) => {
    const hit = !q || r.normalizedArtist.includes(q) || r.normalizedTitle.includes(q);
    const kindOk = !kind || r.kind === kind;
    return hit && kindOk;
  });

  if (state.sort === "date_asc") rows.sort((a, b) => (a.date8 || "").localeCompare(b.date8 || ""));
  else if (state.sort === "title_asc") rows.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ja"));
  else rows.sort((a, b) => (b.date8 || "").localeCompare(a.date8 || ""));

  state.filtered = rows;
}

async function reload() {
  renderStatus("読込中...");
  const { rows, sourceType, error } = await loadSongsWithFallback();
  state.raw = rows;
  state.sourceType = sourceType;
  state.error = error;

  fillFilters(rows);
  refreshView();

  if (error) {
    renderStatus(error, true);
    return;
  }
}

function handleCopy(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(
    () => renderStatus(`コピーしました: ${text}`),
    () => renderStatus("コピーに失敗しました。", true)
  );
}

function wireEvents() {
  document.getElementById("qInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    refreshView();
  });

  document.getElementById("kindFilter").addEventListener("change", (e) => {
    state.kind = e.target.value;
    refreshView();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    refreshView();
  });

  document.getElementById("reloadButton").addEventListener("click", reload);
}

initStaticText();
wireEvents();
reload();
