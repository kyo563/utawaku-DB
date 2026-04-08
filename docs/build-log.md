# build-log

## 2026-04-08 (R2公開パイプライン堅牢化: payload正規化 + songs/archive分離 + archive分割JSON)

### 変更内容
- `scripts/export-jsonp.mjs` に payload 正規化処理を追加し、`{sheets}` と `{ok,mode,data:{sheets}}` の両方を受理するように変更。
- 同スクリプトで診断ログを強化し、`target sheets not found` の前に `top-level/data/sheets keys` を把握できるよう改善。
- 出力を JSON 正規ルートへ拡張し、`public-data/songs.json`、`public-data/archive/index.json`、`public-data/archive/chunks/*.json` を生成。
- 互換維持として既存JSONP（`songs.js` / `archive-manifest.js` / `archive-chunks/*.js`）も継続出力。
- `gas/Code.deploy.gs` / `gas/Code.gs` を `mode=exportContractV1|songs|archive` 対応に変更し、返却構造を `{ok,mode,data}` に統一。
- `.github/workflows/publish-jsonp-r2.yml` を songs/archive 分離取得 + 構造検証 + JSON/JSONP 並行アップロードへ更新。
- `src/data-source.js` を R2 JSON 優先に更新し、`archive/index.json` から chunk を段階読み込みする方式に変更。
- `index.html` に `utawaku:data-archive-index` と `utawaku:allow-gas-fallback=false` を追加。

### 変更理由
- GitHub Actions 失敗原因（payload構造差）を根本吸収し、将来のレスポンス形揺れでも詰まりにくくするため。
- archive 増加時に単一巨大ファイル依存を避け、分割JSON運用へ移行するため。
- 本番HTMLの責務を R2 静的 fetch 中心に寄せ、GAS 直接依存を縮小するため。

### 影響ファイル
- `scripts/export-jsonp.mjs`
- `gas/Code.deploy.gs`
- `gas/Code.gs`
- `.github/workflows/publish-jsonp-r2.yml`
- `src/data-source.js`
- `src/config.js`
- `index.html`
- `docs/build-log.md`

### 注意点
- フロントは archive chunk を初回 `archiveInitialChunkCount` 件（既定3件）まで読込むため、全件検索は段階読込前提になる。
- R2 には JSON を正規配布しつつ、移行期間は JSONP も併存配布する。

### 未解決事項
- UI側で追加chunkをユーザー操作に応じて継続読込するUX（必要時に別作業で追加）。


## 2026-04-08 (GitHub Actions定期実行追加 + 名称明確化)

### 変更内容
- `.github/workflows/publish-jsonp-r2.yml` の workflow 名を `サーバーアップロード` に変更。
- 同 workflow に `schedule` トリガー（`0 0 * * *`）を追加し、24時間に1回の定期実行を有効化。

### 変更理由
- Action名を用途が伝わる名称にし、スプレッドシート→JSONP→R2アップロードを毎日自動実行する要件を満たすため。

### 影響ファイル
- `.github/workflows/publish-jsonp-r2.yml`
- `docs/build-log.md`

### 注意点
- cron は UTC 基準。`0 0 * * *` は毎日 00:00 UTC 実行。

### 未解決事項
- `GAS_WEB_APP_URL` / `CF_R2_*` Secrets の本番値設定と実行確認。

## 2026-04-08 (フロント最小リファクタリング: 可読性向上と重複削減)

### 変更内容
- `src/app.js` のイベント処理とフィルタ/ソート処理を小関数に分割し、DOM参照の重複を削減。
- `src/data-source.js` の static/GAS 読込後の整形処理を共通化し、エラー文言生成を関数化。
- `src/utils.js` の時刻抽出と重複キー生成を小関数に分割し、判定ロジックを明確化。

### 変更理由
- 既存挙動を維持したまま、保守時に読み取りやすく壊しにくい構造へ整理するため。

### 影響ファイル
- `src/app.js`
- `src/data-source.js`
- `src/utils.js`
- `docs/build-log.md`

### 注意点
- 機能追加は行っておらず、UI/データ契約は従来のまま。

### 未解決事項
- GAS endpoint / R2 本番値の設定確認は別作業。

## 2026-04-08 (ActionsのR2接続をSecrets endpoint参照へ統一)

### 変更内容
- `.github/workflows/publish-jsonp-r2.yml` のR2接続先を `CF_R2_ACCOUNT_ID` 由来の組み立てから、`CF_R2_ENDPOINT` Secret参照に変更。
- アップロード前に `CF_R2_ENDPOINT` と `CF_R2_BUCKET` の必須チェックを追加。

### 変更理由
- `docs/r2-setup-guide.md` のSecrets定義とWorkflow実装を一致させ、設定ミスを減らすため。
- 「シークレットを参照してR2へ接続」の運用要件を明確にするため。

### 影響ファイル
- `.github/workflows/publish-jsonp-r2.yml`
- `docs/build-log.md`

### 注意点
- 実アップロード成否はGitHub Secretsの実値設定に依存。

### 未解決事項
- `GAS_WEB_APP_URL` / `CF_R2_*` の本番値設定と本番実行確認。

## 2026-04-08 (README整合: GAS仮組とJSONP/R2最終形の段階分離)

### 変更内容
- `README.md` 後半の「JSONP + R2 公開フロー（v1）」を更新。
- 現在は R2 未立ち上げのため GAS 直接読込で仮運用中であることを明記。
- 将来の最終形（JSONP生成→R2配置→フロント読込）を段階として整理。

### 変更理由
- README の説明が最終形寄りで、現行運用（GAS直読込）との衝突があったため。

### 影響ファイル
- `README.md`
- `docs/build-log.md`

### 注意点
- 本変更はドキュメント修正のみで、実装コードやデータ契約は変更していない。

### 未解決事項
- `CF_R2_*` と `GAS_WEB_APP_URL` の本番値設定、およびR2本番移行作業。

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

## 2026-04-08 (3層UI再設計: 検索+絞り込み+定型弾幕)

### 変更内容
- `index.html` を「上部絞り込み / 中部カード一覧 / 下部検索+弾幕」の3層レイアウトへ再構成。
- 画面配色を中立色ベースに整理し、CSS変数で差し替えやすい最小テーマに更新。
- `src/app.js` を状態管理中心に整理し、検索(debounce)・絞り込み・並び替え・定型弾幕コピーを分離。
- `src/render.js` に上部ステータス描画、カード描画、空/読込/エラー表示、弾幕プリセット描画を実装。
- `src/config.js` に並び順（アーティスト順含む）と定型弾幕プリセット定義を追加。
- `src/state.js` に弾幕選択状態を追加。

### 変更理由
- uni-uta-db の骨格（上/中/下）を保ちつつ、固有演出を外し、拡張しやすいバニラUIへ整理するため。
- 弾幕機能は維持しつつ、カスタム弾幕作成機能を除外して保守コストを下げるため。

### 影響ファイル
- `index.html`
- `src/app.js`
- `src/render.js`
- `src/config.js`
- `src/state.js`
- `docs/build-log.md`

### 注意点
- 弾幕は定型プリセット選択+コピーのみに限定。
- カスタム弾幕入力/保存UIは未実装（仕様通り）。

### 未解決事項
- 参照元（uni-uta-db / kasane-3khz-songsDB）との差分検証は別途必要。

## 2026-04-08 (上部絞り込みメニュー再定義)

### 変更内容
- 上部メニューを2段構成に変更し、1段目をステータスバー + 展開/折り畳みボタンに更新。
- 2段目に「歌枠 / 歌ってみた / ショート」のチェック式絞り込み、並び替えトグル、昇順/降順トグルを追加。
- 2段目は展開/折り畳みで表示切り替え可能にし、カード背景を1段目のみ/1-2段目で切り替える表示に対応。
- モバイル表示で2段目が収まるよう文字サイズと余白を調整。
- ボタン/チェックボックスのアクセントカラーとフォーカスリングを統一。

### 変更理由
- 指定された上部絞り込みメニュー仕様（2段構成、トグル操作、モバイル収まり）に合わせるため。

### 影響ファイル
- `index.html`
- `src/app.js`
- `src/render.js`
- `src/state.js`
- `docs/build-log.md`

### 注意点
- ステータス表示は既存の読込結果（`static-json` / `gas-api`）を利用し、文言を `R2状態` として表示する。
- 絞り込み対象は固定で `歌枠 / 歌ってみた / ショート` の3種。

### 未解決事項
- 実R2エンドポイントの接続性は環境依存のため、この変更では検証していない。

## 2026-04-08 (GAS doGetのJSONエラーハンドリング強化)

### 変更内容
- `gas/Code.deploy.gs` の `doGet(e)` に `try/catch` を追加。
- `mode=exportContractV1` 成功時レスポンスを `{ ok, mode, data }` で返すように変更。
- 未対応 mode / 例外時を含め、常に JSON（または callback 指定時は JSONP）を返す `jsonResponse_()` を追加。
- エラーメッセージ整形用 `toErrorMessage_()` を追加。

### 変更理由
- GitHub Actions の `curl` + Node.js 連携で HTML 応答混入を避け、JSON APIとして安定化するため。

### 影響ファイル
- `gas/Code.deploy.gs`
- `docs/build-log.md`

### 注意点
- `callback` パラメータがある場合は従来どおり JSONP 返却。

### 未解決事項
- 本番GASデプロイURLに対する実運用環境での疎通確認。

## 2026-04-08 (Cloudflare R2 CORS 最小設定)

### 変更内容
- Cloudflare R2 の対象バケットに CORS 設定を追加。
- 公開HTML配信元からの JSON 読み込みのみを許可する最小構成とした。
- 許可した method は `GET`, `HEAD` のみ。
- 書き込み系 method（`PUT`, `POST`, `DELETE`）は許可していない。
- 認証付き通信は前提とせず、公開 JSON の `fetch()` 用設定とした。

### 実施場所
- Cloudflare Dashboard
- R2
- 対象バケット
- Settings
- CORS policy（名称はUI差異の可能性あり）

### 設定値
```json
[
  {
    "AllowedOrigins": ["https://example.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": [],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```
