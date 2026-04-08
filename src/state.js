export function createState() {
  return {
    loading: false,
    error: "",
    sourceType: "",
    raw: [],
    filtered: [],
    query: "",
    kinds: new Set(["歌枠", "歌ってみた", "ショート"]),
    sortBy: "date",
    order: "desc",
    topMenuOpen: true,
    danmakuPreset: ""
  };
}
