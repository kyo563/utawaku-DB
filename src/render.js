import { APP_CONFIG, KIND_ORDER } from "./config.js";

export function initStaticText() {
  document.getElementById("appTitle").textContent = APP_CONFIG.title;
  document.getElementById("appDescription").textContent = APP_CONFIG.description;
}

export function fillFilters(rows) {
  const kind = document.getElementById("kindFilter");
  const sort = document.getElementById("sortSelect");

  const kinds = [...new Set(rows.map((r) => r.kind))].filter(Boolean);
  kinds.sort((a, b) => {
    const ia = KIND_ORDER.indexOf(a);
    const ib = KIND_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "ja");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  kind.innerHTML = [
    `<option value="">${APP_CONFIG.labels.allKinds}</option>`,
    ...kinds.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
  ].join("");

  sort.innerHTML = [
    `<option value="date_desc">${APP_CONFIG.labels.sortDateDesc}</option>`,
    `<option value="date_asc">${APP_CONFIG.labels.sortDateAsc}</option>`,
    `<option value="title_asc">${APP_CONFIG.labels.sortTitleAsc}</option>`,
    `<option value="artist_asc">${APP_CONFIG.labels.sortArtistAsc}</option>`
  ].join("");
}

export function fillDanmakuPresets() {
  const select = document.getElementById("danmakuType");
  select.innerHTML = APP_CONFIG.danmakuPresets
    .map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.label)}</option>`)
    .join("");
}

export function getDanmakuTextByPreset(presetId) {
  const found = APP_CONFIG.danmakuPresets.find((preset) => preset.id === presetId);
  return found ? found.text : "";
}

export function renderTopStatus({ loading, error, filteredCount, totalCount, sourceType }) {
  const status = document.getElementById("status");
  const count = document.getElementById("countInfo");

  count.textContent = `${filteredCount}件 / 全${totalCount}件`;

  if (loading) {
    status.textContent = "読込中...";
    status.dataset.state = "loading";
    return;
  }

  if (error) {
    status.textContent = error;
    status.dataset.state = "error";
    return;
  }

  status.textContent = sourceType ? `読込元: ${sourceType}` : "待機中";
  status.dataset.state = "ready";
}

export function renderList({ rows, loading, error }) {
  const list = document.getElementById("resultList");

  if (loading) {
    list.innerHTML = `<li class="state-card" data-state="loading">データを読込中です...</li>`;
    return;
  }

  if (error) {
    list.innerHTML = `<li class="state-card" data-state="error">${escapeHtml(error)}</li>`;
    return;
  }

  if (!rows.length) {
    list.innerHTML = `<li class="state-card" data-state="empty">該当データがありません。</li>`;
    return;
  }

  list.innerHTML = rows.map((r) => renderSongCard(r)).join("");
}

function renderSongCard(r) {
  const title = escapeHtml(r.title || "(無題)");
  const artist = escapeHtml(r.artist || "(不明)");
  const kind = escapeHtml(r.kind || "-");
  const date = escapeHtml(r.displayDate || "日付不明");
  const url = escapeHtml(r.dUrl || "");
  const link = url
    ? `<a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer">詳細へ</a>`
    : `<span class="card-link is-disabled">リンクなし</span>`;

  return `
    <li class="song-card">
      <p class="song-card__title">${title}</p>
      <p class="song-card__artist">${artist}</p>
      <p class="song-card__meta">${kind} / ${date}</p>
      <div class="song-card__actions">${link}</div>
    </li>
  `;
}

export function renderToast(message, isError = false) {
  const toast = document.getElementById("copyStatus");
  toast.textContent = message;
  toast.dataset.state = isError ? "error" : "ok";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
