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
    `<option value="title_asc">${APP_CONFIG.labels.sortTitleAsc}</option>`
  ].join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderStatus(text, isError = false) {
  const el = document.getElementById("status");
  el.textContent = text;
  el.classList.toggle("error", isError);
}

export function renderList(rows, onCopy) {
  const list = document.getElementById("resultList");
  if (!rows.length) {
    list.innerHTML = "<li class=\"meta\">該当データがありません。</li>";
    return;
  }

  list.innerHTML = rows
    .map((r) => {
      const title = escapeHtml(r.title || "(無題)");
      const artist = escapeHtml(r.artist || "(不明)");
      const kind = escapeHtml(r.kind || "-");
      const date = escapeHtml(r.displayDate || "日付不明");
      const url = escapeHtml(r.dUrl || "");
      const copyText = escapeHtml(`${r.artist} - ${r.title}`);
      const link = url ? `<a class=\"primary\" href=\"${url}\" target=\"_blank\" rel=\"noopener noreferrer\">配信へ移動</a>` : "";
      return `
        <li class="card">
          <p class="song">${title}</p>
          <p class="meta">${artist} / ${kind} / ${date}</p>
          <div class="actions">
            ${link}
            <button data-copy="${copyText}" type="button">コピー</button>
          </div>
        </li>
      `;
    })
    .join("");

  list.querySelectorAll("button[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => onCopy(btn.getAttribute("data-copy") || ""));
  });
}
