import { APP_CONFIG } from "./config.js";

export function initStaticText() {
  document.getElementById("appTitle").textContent = APP_CONFIG.title;
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

  count.textContent = `表示 ${filteredCount}件 / 全${totalCount}件`;

  if (loading) {
    status.textContent = "R2状態: 読込中...";
    status.dataset.state = "loading";
    return;
  }

  if (error) {
    status.textContent = `R2状態: 異常 (${error})`;
    status.dataset.state = "error";
    return;
  }

  status.textContent = `R2状態: 正常 (${sourceType || "unknown"})`;
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
