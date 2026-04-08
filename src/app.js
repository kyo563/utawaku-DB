import { loadSongsWithFallback } from "./data-source.js";
import { fillDanmakuPresets, getDanmakuTextByPreset, initStaticText, renderList, renderToast, renderTopStatus } from "./render.js";
import { createState } from "./state.js";
import { normalizeText } from "./utils.js";

const DEFAULT_KINDS = ["歌枠", "歌ってみた", "ショート"];
const SORT_LABELS = {
  date: "投稿日順",
  artist: "歌手名順",
  title: "楽曲名順"
};

const state = createState();
let debounceTimer = null;

function getElements() {
  return {
    qInput: document.getElementById("qInput"),
    clearSearch: document.getElementById("clearSearch"),
    kindCheckboxes: document.querySelectorAll('#kindFilters input[type="checkbox"]'),
    sortToggle: document.getElementById("sortToggle"),
    orderToggle: document.getElementById("orderToggle"),
    toggleTopMenu: document.getElementById("toggleTopMenu"),
    topRow2: document.getElementById("topRow2"),
    topCard: document.getElementById("topCard"),
    danmakuType: document.getElementById("danmakuType"),
    copyDanmaku: document.getElementById("copyDanmaku")
  };
}

const elements = getElements();

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

  const filtered = state.raw.filter((row) => isVisibleRow(row, q, activeKinds));
  sortRows(filtered, state.sortBy, state.order);
  state.filtered = filtered;
}

function isVisibleRow(row, query, activeKinds) {
  const hit = !query || row.normalizedArtist.includes(query) || row.normalizedTitle.includes(query);
  return hit && activeKinds.has(row.kind);
}

function sortRows(rows, sortBy, order) {
  if (sortBy === "artist") {
    rows.sort((a, b) => (a.artist || "").localeCompare(b.artist || "", "ja"));
  } else if (sortBy === "title") {
    rows.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ja"));
  } else {
    rows.sort((a, b) => (a.date8 || "").localeCompare(b.date8 || ""));
  }

  if (order === "desc") rows.reverse();
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
  elements.sortToggle.textContent = SORT_LABELS[state.sortBy];
  elements.orderToggle.textContent = state.order === "desc" ? "降順" : "昇順";
}

function nextSort(current) {
  if (current === "date") return "artist";
  if (current === "artist") return "title";
  return "date";
}

function toggleTopMenu() {
  state.topMenuOpen = !state.topMenuOpen;
  elements.topRow2.hidden = !state.topMenuOpen;
  elements.toggleTopMenu.textContent = state.topMenuOpen ? "▴" : "▾";
  elements.toggleTopMenu.setAttribute("aria-expanded", String(state.topMenuOpen));
  elements.toggleTopMenu.setAttribute("aria-label", state.topMenuOpen ? "上部メニューを折りたたむ" : "上部メニューを展開する");
  elements.topCard.classList.toggle("is-collapsed", !state.topMenuOpen);
}

function handleQueryInput(value) {
  state.query = value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshView, 120);
}

function readCheckedKinds() {
  const checkedKinds = [...elements.kindCheckboxes].filter((el) => el.checked).map((el) => el.value);
  return new Set(checkedKinds.length ? checkedKinds : DEFAULT_KINDS);
}

function copyDanmakuText() {
  const text = getDanmakuTextByPreset(state.danmakuPreset);
  if (!text) {
    renderToast("弾幕が未選択です。", true);
    return;
  }

  navigator.clipboard.writeText(text).then(
    () => renderToast("弾幕をコピーしました。"),
    () => renderToast("コピーに失敗しました。", true)
  );
}

function wireEvents() {
  elements.qInput.addEventListener("input", (e) => {
    handleQueryInput(e.target.value);
  });

  elements.qInput.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    elements.qInput.value = "";
    state.query = "";
    refreshView();
  });

  elements.clearSearch.addEventListener("click", () => {
    elements.qInput.value = "";
    state.query = "";
    refreshView();
    elements.qInput.focus();
  });

  elements.kindCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.kinds = readCheckedKinds();
      refreshView();
    });
  });

  elements.sortToggle.addEventListener("click", () => {
    state.sortBy = nextSort(state.sortBy);
    refreshView();
  });

  elements.orderToggle.addEventListener("click", () => {
    state.order = state.order === "desc" ? "asc" : "desc";
    refreshView();
  });

  elements.toggleTopMenu.addEventListener("click", toggleTopMenu);

  elements.danmakuType.addEventListener("change", (e) => {
    state.danmakuPreset = e.target.value;
  });

  elements.copyDanmaku.addEventListener("click", copyDanmakuText);
}

initStaticText();
fillDanmakuPresets();
syncSortButtons();
state.danmakuPreset = elements.danmakuType.value;
wireEvents();
reload();
