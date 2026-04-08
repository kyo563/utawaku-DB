export const APP_CONFIG = {
  title: "Utawaku-DB",
  description: "歌枠履歴を検索し、配信導線へ移動できる静的DB",
  labels: {
    allKinds: "すべての種別",
    sortDateDesc: "新しい順",
    sortDateAsc: "古い順",
    sortTitleAsc: "曲名A-Z"
  },
  fallbackLimit: 200,
  copyTemplate: "{artist} - {title}"
};

export const KIND_ORDER = ["歌枠", "歌ってみた", "ショート", "アーカイブ系"];
