import { loadSongsWithFallback } from "./data-source.js";
import { fillDanmakuPresets, getDanmakuTextByPreset, initStaticText, renderList, renderToast, renderTopStatus } from "./render.js";
import { createState } from "./state.js";
import { normalizeText } from "./utils.js";

const state = createState();
let debounceTimer = null;

const SORT_LABELS = {
  date: "投稿日順",
  artist: "歌手名順",
  title: "楽曲名順"
};

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
  syncSortButtons();
}

function applyFilterAndSort() {
  const q = normalizeText(state.query);
  const activeKinds = state.kinds;

  let rows = state.raw.filter((r) => {
    const hit = !q || r.normalizedArtist.includes(q) || r.normalizedTitle.includes(q);
    const kindOk = activeKinds.has(r.kind);
    return hit && kindOk;
  });

  if (state.sortBy === "artist") rows.sort((a, b) => (a.artist || "").localeCompare(b.artist || "", "ja"));
  else if (state.sortBy === "title") rows.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ja"));
  else rows.sort((a, b) => (a.date8 || "").localeCompare(b.date8 || ""));

  if (state.order === "desc") rows.reverse();

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

  refreshView();
}

function syncSortButtons() {
  const sortButton = document.getElementById("sortToggle");
  const orderButton = document.getElementById("orderToggle");
  sortButton.textContent = SORT_LABELS[state.sortBy];
  orderButton.textContent = state.order === "desc" ? "降順" : "昇順";
}

function nextSort(current) {
  if (current === "date") return "artist";
  if (current === "artist") return "title";
  return "date";
}

function toggleTopMenu() {
  state.topMenuOpen = !state.topMenuOpen;
  const row2 = document.getElementById("topRow2");
  const button = document.getElementById("toggleTopMenu");
  const card = document.getElementById("topCard");

  row2.hidden = !state.topMenuOpen;
  button.textContent = state.topMenuOpen ? "▴" : "▾";
  button.setAttribute("aria-expanded", String(state.topMenuOpen));
  button.setAttribute("aria-label", state.topMenuOpen ? "上部メニューを折りたたむ" : "上部メニューを展開する");
  card.classList.toggle("is-collapsed", !state.topMenuOpen);
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

  document.querySelectorAll('#kindFilters input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checkedKinds = [...document.querySelectorAll('#kindFilters input[type="checkbox"]:checked')].map((el) => el.value);
      state.kinds = new Set(checkedKinds.length ? checkedKinds : ["歌枠", "歌ってみた", "ショート"]);
      refreshView();
    });
  });

  document.getElementById("sortToggle").addEventListener("click", () => {
    state.sortBy = nextSort(state.sortBy);
    refreshView();
  });

  document.getElementById("orderToggle").addEventListener("click", () => {
    state.order = state.order === "desc" ? "asc" : "desc";
    refreshView();
  });

  document.getElementById("toggleTopMenu").addEventListener("click", toggleTopMenu);

  document.getElementById("danmakuType").addEventListener("change", (e) => {
    state.danmakuPreset = e.target.value;
  });

  document.getElementById("copyDanmaku").addEventListener("click", () => {
    const text = getDanmakuTextByPreset(state.danmakuPreset);
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => renderToast("弾幕をコピーしました。"),
      () => renderToast("コピーに失敗しました。", true)
    );
  });
}

initStaticText();
fillDanmakuPresets();
syncSortButtons();
state.danmakuPreset = document.getElementById("danmakuType").value;
wireEvents();
reload();
