export const APP_CONFIG = {
  title: "Utawaku-DB",
  description: "歌枠履歴を検索し、配信導線へ移動できる静的DB",
  labels: {
    allKinds: "すべての区分",
    sortDateDesc: "新しい順",
    sortDateAsc: "古い順",
    sortTitleAsc: "曲名順",
    sortArtistAsc: "アーティスト順"
  },
  fallbackLimit: 200,
  danmakuPresets: [
    { id: "call", label: "定型コール", text: "👏👏👏 最高！" },
    { id: "music", label: "定型応援", text: "🎶🎶🎶 ナイス歌枠！" },
    { id: "simple", label: "シンプル", text: "✨✨✨" }
  ],
  copyTemplate: "{artist} - {title}"
};

export const KIND_ORDER = ["歌枠", "歌ってみた", "ショート", "アーカイブ系", "その他"];
