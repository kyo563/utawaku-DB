# build-log

## 2026-04-08

### 変更内容
- Utawaku-DB の最小実装を追加（静的フロント + JSON優先 + GASフォールバック）。
- `index.html` と `src/*.js` を追加し、検索・kindフィルタ・並び替え・コピー導線を実装。
- `public-data/*.json` の初期サンプルを追加。
- `gas/Code.gs` を追加し、sheet指定・検索・厳密一致・ページング・JSONP・キャッシュに対応。
- `scripts/validate-json.mjs` を追加。
- `README.md` と `docs/repro-spec.md` を再構成し、責務・再現手順・データ契約を明文化。

### 変更理由
- ドキュメントのみの状態から、再現可能な最小アプリ構成を確立するため。
- static-first と low-cost 運用を維持しつつ、GASフォールバックを併用できる形にするため。

### 影響ファイル
- `README.md`
- `index.html`
- `src/app.js`
- `src/config.js`
- `src/data-source.js`
- `src/render.js`
- `src/state.js`
- `src/utils.js`
- `public-data/meta.json`
- `public-data/songs.json`
- `public-data/gags.json`
- `public-data/archive.json`
- `gas/Code.gs`
- `scripts/validate-json.mjs`
- `assets/icons/README.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

### 注意点
- `index.html` の GAS endpoint は空。運用時に実URLを設定すること。
- `public-data/*.json` はサンプル値。実運用前に実データへ置換すること。
- GAS はアクティブスプレッドシート前提。単体実行時はシート紐付け確認が必要。

### 未解決事項
- 参照元（uni-uta-DB / kasane-3khz-songsDB）の実ファイル差分レビューは別途必要。

