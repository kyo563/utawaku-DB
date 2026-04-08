export function createState() {
  return {
    loading: false,
    error: "",
    sourceType: "",
    raw: [],
    filtered: [],
    query: "",
    kind: "",
    sort: "date_desc",
    danmakuPreset: ""
  };
}
