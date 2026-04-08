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


## 2026-04-08 (JSONP/R2 契約具体化)

### 変更内容
- スプレッドシート実体（2シート・A3:D）に合わせた具体契約を `docs/sheets-jsonp-r2-spec.md` として追加。
- `docs/repro-spec.md` を、Spreadsheet → GAS → JSONP生成 → R2アップロードの再現仕様に更新。
- `gas/Code.gs` を `mode=exportContractV1` の最小エクスポート用に整理（2シート固定・D列ハイパーリンクURL抽出）。
- `scripts/export-jsonp.mjs` を追加（正規化、検証、songs単体JSONP + archive manifest/chunk JSONP 生成）。
- `.github/workflows/publish-jsonp-r2.yml` を追加（GAS取得→JSONP生成→R2再帰アップロード）。
- `README.md` に JSONP + R2 公開フロー（v1）を追記。

### 変更理由
- 汎用仕様のままだと、対象シート構造・重複定義・JSONPファイル配置・R2アップロード契約が曖昧で再現性が不足するため。
- archive 大容量化に備え、manifest + chunk 方式を先に契約化するため。

### 影響ファイル
- `README.md`
- `docs/repro-spec.md`
- `docs/sheets-jsonp-r2-spec.md`
- `docs/build-log.md`
- `gas/Code.gs`
- `scripts/export-jsonp.mjs`
- `.github/workflows/publish-jsonp-r2.yml`

### 注意点
- 実Spreadsheet接続（GASデプロイURL）は未検証。
- R2アップロードは Secrets 未設定のため、このリポジトリ内では未検証。
- `validation-warnings.json` は warning 出力であり、自動修正は行わない。

### 未解決事項
- `GAS_WEB_APP_URL` の本番値。
- `CF_R2_*` の本番値。
- archive の最適 chunk size（初期値1000）。

## 2026-04-08 (要件定義の明確化: シート2枚 + JSONP/R2)

### 変更内容
- `docs/sheets-jsonp-r2-spec.md` を v1.1 として更新し、ユーザー指定の要件を明文化。
- 2シート共通の列構成（A3:D3）、同一曲定義（A+B）、重複定義（URL完全一致）を明示。
- 最新楽曲ルール（歌ってみた > 歌枠 > ショート + 同区分内投稿日優先）を明示。
- JSONP出力で `songs` と `archive` を判別し、archiveを manifest + chunks で全件配布する契約を明示。

### 変更理由
- 既存仕様の意図は近かったが、今回提示された運用ルール（最新判定、重複の前提、タイムスタンプURLの扱い）を文書上でより厳密に固定するため。

### 影響ファイル
- `docs/sheets-jsonp-r2-spec.md`
- `docs/build-log.md`

### 注意点
- 本変更は仕様文書の更新のみで、実データ取得やR2アップロードの実行確認は含まない。

### 未解決事項
- `GAS_WEB_APP_URL` および `CF_R2_*` の本番値設定。

## 2026-04-08 (GAS転記用ファイル追加)

### 変更内容
- GASへそのまま貼り付け可能な転記専用ファイル `gas/Code.deploy.gs` を追加。
- `mode=exportContractV1` で2シート（歌った曲リスト / アーカイブシート）を抽出し、JSON/JSONPを返す実装を追加。
- ヘッダ不一致、`sourceUrl` 欠落、`sourceUrl` 重複を `warnings` として返すようにした。
- `docs/sheets-jsonp-r2-spec.md` に転記ファイルとエンドポイント仕様を追記。

### 変更理由
- 「このファイルをそのまま貼り付けてGASデプロイしたい」という運用要件に対応するため。
- 仕様書と実コードの対応を明確化し、運用時の転記ミスを減らすため。

### 影響ファイル
- `gas/Code.deploy.gs`
- `docs/sheets-jsonp-r2-spec.md`
- `docs/build-log.md`

### 注意点
- 本変更はGASコードと仕様文書の追加であり、実際のGASデプロイおよびR2アップロードは未実行。

### 未解決事項
- 本番 `GAS_WEB_APP_URL` と `CF_R2_*` の設定。

## 2026-04-08 (R2立ち上げガイド追加)

### 変更内容
- `docs/r2-setup-guide.md` を追加し、Cloudflare R2 の作成手順と GitHub Secrets へ入力する値を整理。
- `README.md` に R2 ガイドへの参照リンクを追加。

### 変更理由
- スプレッドシート/GASデプロイ内容を前提に、R2設定時の入力値を迷わないようにするため。

### 影響ファイル
- `docs/r2-setup-guide.md`
- `README.md`
- `docs/build-log.md`

### 注意点
- 本変更はガイド追加のみ。Cloudflare / GAS 本番環境への実投入は未実施。

### 未解決事項
- `GAS_WEB_APP_URL` と `CF_R2_*` の本番値は運用環境側で設定が必要。

## 2026-04-08 (gags撤去 + songs/archive 読込整理 + workflow追加)

### 変更内容
- フロントから `gags` 参照を撤去し、`songs` + `archive` の2データ読込に整理。
- `src/data-source.js` で static/GAS の双方を `songs` + `archive` 取得へ変更し、結合して正規化するよう更新。
- `scripts/validate-json.mjs` から `public-data/gags.json` の検証を削除。
- `public-data/gags.json` を削除。
- `.github/workflows/publish-jsonp-r2.yml` を追加（GAS取得→JSONP生成→R2アップロード）。
- `README.md` のデータ構成説明を `songs/archive` に更新。

### 変更理由
- 本アプリのスコープ外である `gags` を完全整理し、仕様を `songs/archive` 中心に揃えるため。
- 仕様書記載の workflow 実体が欠けていたため、再現導線を補完するため。

### 影響ファイル
- `index.html`
- `src/app.js`
- `src/config.js`
- `src/data-source.js`
- `scripts/validate-json.mjs`
- `public-data/gags.json`（削除）
- `.github/workflows/publish-jsonp-r2.yml`（追加）
- `README.md`
- `docs/build-log.md`

### 注意点
- GAS fallback は `sheet=songs` と `sheet=archive` の2回呼び出しを行う。
- workflow 実行には `GAS_WEB_APP_URL` と `CF_R2_*` secrets が必要。

### 未解決事項
- 実運用 secrets 未設定環境での workflow 実行確認は未実施。
