import { loadSongsWithFallback } from "./data-source.js";
import {
  fillDanmakuPresets,
  fillFilters,
  getDanmakuTextByPreset,
  initStaticText,
  renderList,
  renderToast,
  renderTopStatus
} from "./render.js";
import { createState } from "./state.js";
import { normalizeText } from "./utils.js";

const state = createState();
let debounceTimer = null;

function refreshView() {
  applyFilterAndSort();
  renderTopStatus({
    loading: state.loading,
    error: state.error,
    filteredCount: state.filtered.length,
    totalCount: state.raw.length,
    sourceType: state.sourceType
  });
  renderList({ rows: state.filtered, loading: state.loading, error: state.error });
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
  else if (state.sort === "artist_asc") rows.sort((a, b) => (a.artist || "").localeCompare(b.artist || "", "ja"));
  else rows.sort((a, b) => (b.date8 || "").localeCompare(a.date8 || ""));

  state.filtered = rows;
}

async function reload() {
  state.loading = true;
  state.error = "";
  refreshView();

  const { rows, sourceType, error } = await loadSongsWithFallback();
  state.raw = rows;
  state.sourceType = sourceType;
  state.error = error;
  state.loading = false;

  fillFilters(rows);
  refreshView();
}

function resetFilters() {
  state.query = "";
  state.kind = "";
  state.sort = "date_desc";
  const qInput = document.getElementById("qInput");
  const kindFilter = document.getElementById("kindFilter");
  const sortSelect = document.getElementById("sortSelect");
  qInput.value = "";
  kindFilter.value = "";
  sortSelect.value = "date_desc";
  refreshView();
}

function handleCopyDanmaku() {
  const text = getDanmakuTextByPreset(state.danmakuPreset);
  if (!text) return;

  navigator.clipboard.writeText(text).then(
    () => renderToast("弾幕をコピーしました。"),
    () => renderToast("コピーに失敗しました。", true)
  );
}

function wireEvents() {
  document.getElementById("qInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshView, 120);
  });

  document.getElementById("qInput").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.target.value = "";
      state.query = "";
      refreshView();
    }
  });

  document.getElementById("clearSearch").addEventListener("click", () => {
    const qInput = document.getElementById("qInput");
    qInput.value = "";
    state.query = "";
    refreshView();
    qInput.focus();
  });

  document.getElementById("kindFilter").addEventListener("change", (e) => {
    state.kind = e.target.value;
    refreshView();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    refreshView();
  });

  document.getElementById("resetFilters").addEventListener("click", resetFilters);
  document.getElementById("reloadButton").addEventListener("click", reload);

  document.getElementById("danmakuType").addEventListener("change", (e) => {
    state.danmakuPreset = e.target.value;
  });

  document.getElementById("copyDanmaku").addEventListener("click", handleCopyDanmaku);
}

initStaticText();
fillDanmakuPresets();
state.danmakuPreset = document.getElementById("danmakuType").value;
wireEvents();
reload();
