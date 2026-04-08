# Utawaku-DB

Utawaku-DB は、歌枠の履歴を「今すぐ使える導線」に変えるための静的DBアプリです。  
スプレッドシートを直接見せず、検索しやすい画面と配信リンクを提供します。

## 何を元に設計したか

- UI/構成の土台: **uni-uta-DB**
- データ取得・正規化・GAS APIの考え方: **kasane-3khz-songsDB**

本リポジトリでは、固有名詞依存を避けた汎用実装として再構築しています。

## 全体構成図

```text
Google Spreadsheet
   │
   ├─(任意) GAS API: gas/Code.gs
   │
   ├─ scripts/validate-json.mjs（JSON検証）
   │
   └─ public-data/*.json（静的配布）
             │
             └─ index.html + src/*.js（検索UI）
```

## ファイル構成と役割

- `index.html`: エントリーポイント。metaタグでデータURL/GAS URLを受け取る
- `src/app.js`: 起動処理、検索・フィルタ・並び替えの適用
- `src/config.js`: 文言・種別順・コピー設定
- `src/data-source.js`: static JSON優先 + GASフォールバック読込
- `src/render.js`: ステータス/結果の描画
- `src/state.js`: 画面状態
- `src/utils.js`: 正規化、date8抽出、重複除去、派生値生成
- `public-data/`: `songs.json` / `archive.json` / `meta.json`
- `gas/Code.gs`: Spreadsheetを読む軽量API（検索・ページング・JSONP対応）
- `scripts/validate-json.mjs`: JSON構文チェック
- `docs/repro-spec.md`: 再現仕様書
- `docs/build-log.md`: 変更ログ

## データフロー

1. スプレッドシートで管理
2. 必要に応じてGASでAPI化
3. 公開用JSONを `public-data/` へ配置
4. フロントがJSONを読込
5. 失敗時のみGAS APIへフォールバック

## スプレッドシート前提

想定シート名:
- `songs`
- `archive`

想定開始行:
- 1行目: ヘッダ
- 2行目以降: データ

最低限列（推奨）:
- `artist`
- `title`
- `kind`
- `dText`
- `dUrl`
- `date8`
- `rowId`

## GASデプロイ手順（最小）

1. Google Apps Scriptを新規作成
2. `gas/Code.gs` を貼り付け
3. スプレッドシートに紐付ける
4. 「ウェブアプリ」としてデプロイ（GET許可）
5. 発行URLを `index.html` の `meta[name="utawaku:gas-endpoint"]` に設定

## public-data 生成/利用

初期は `public-data/*.json` の静的ファイルを直接更新します。  
構文チェック:

```bash
node scripts/validate-json.mjs
```

## ローカル確認方法

簡易サーバ例:

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000` を開きます。

## デプロイ方法

- 静的ホスティング（Cloudflare Pages / GitHub Pages / R2+CDN）を想定
- `index.html`, `src/`, `public-data/`, `assets/` を公開

## カスタマイズポイント

- タイトル/説明文: `src/config.js`
- 種別順: `src/config.js`
- テーマ色: `index.html` のCSS変数
- GASフォールバック先: `index.html` metaタグ

## よくある詰まりどころ

- `public-data/songs.json` が配列でない
- `date8` の形式が `yyyymmdd` でない
- GASエンドポイント未設定でフォールバック失敗
- CORS未設定でJSON取得失敗

## 継承点と差分

### uni-uta-DB から継承
- `index.html` 起点の静的フロント
- `src/app.js` 中心のモジュール構成
- モバイル前提の単画面UI
- 配信導線（リンク・コピー）の重視

### kasane-3khz-songsDB から借用
- GASでシート非公開のまま参照
- `songs/archive` の分割思想
- `q/artist/title/exact/limit/offset` パラメータ
- 正規化、重複除去、date/url抽出、キャッシュ


## JSONP + R2 公開フロー（v1）

詳細仕様は `docs/sheets-jsonp-r2-spec.md` を参照。
R2立ち上げとSecrets入力値は `docs/r2-setup-guide.md` を参照。

最小実行例:

```bash
node scripts/export-jsonp.mjs --input tmp/spreadsheet-export.json --out public-data --chunk-size 1000
```

生成物:
- `public-data/songs.js`
- `public-data/archive-manifest.js`
- `public-data/archive-chunks/archive-0001.js` ...
- `public-data/validation-warnings.json`

GitHub Actions:
- `.github/workflows/publish-jsonp-r2.yml`
- GAS から取得した2シートデータを JSONP に変換し、`public-data/**/*.js` を R2 にアップロード
