# Spreadsheet / JSONP / R2 具体仕様（v1.1）

## 1. 対象スプレッドシート

- URL: https://docs.google.com/spreadsheets/d/1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o/edit?gid=0#gid=0
- Spreadsheet ID: `1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o`
- 対象シート（固定）:
  - `歌った曲リスト`
  - `アーカイブシート`

## 2. 共通シート構成（両シート同一）

- ヘッダ位置: `A3:D3`
- データ開始: `A4`
- 列定義:
  - `A`: アーティスト名
  - `B`: 曲名
  - `C`: 区分（タグ文字列）
  - `D`: 出典元情報(直リンク)（セル表示文字列 + ハイパーリンクURL）

## 3. 列ごとの解釈

### 3.1 A列 / B列

- `A` はアーティスト名、`B` は曲名としてそのまま保持する。
- 同一曲判定は `A + B` の完全一致で行う（後述）。

### 3.2 C列（区分）

- 区分は **ASCIIカンマ `,` のみ** で分割する。
- 例:
  - `歌枠,アニソン`
  - `ショート,ボカロ,平成`
- 1行につき、以下 primary kind のいずれかを必ず含む。
  - `歌ってみた`
  - `歌枠`
  - `ショート`
- `primaryKind` は、分割後タグを左から見て最初に見つかった primary kind とする。

### 3.3 D列（出典元情報(直リンク)）

- 表示文字列ではなく、セルに仕込まれたハイパーリンクURL本体を `sourceUrl` として採用する。
- タイムスタンプ付きURL（`t=`, `start=` など）は削らずそのまま保持する。
- 表示文字列の先頭8桁（`yyyymmdd`）を投稿日付の正とする。
- 派生項目:
  - `publishedDate8`: `yyyymmdd`
  - `publishedDate`: `yyyy-mm-dd`
- 先頭8桁が抽出できない場合は warning として記録し、日付を推測補完しない。

## 4. 一意性・重複の定義

### 4.1 同一曲（same song）

次の2項目が両方一致したものを「同一曲」と定義する。
- アーティスト名（A列）
- 曲名（B列）

### 4.2 重複データ（duplicate data）

次の1項目が一致したものを「重複データ」と定義する。
- `sourceUrl`（D列URL。タイムスタンプまで含めた完全一致）

### 4.3 スプレッドシート全体の前提

- 本ファイルには重複データ（同一 `sourceUrl`）は存在しないことを前提とする。
- したがって各レコードは必ず固有の `sourceUrl` を持つ。

## 5. 各シートの意味

### 5.1 `歌った曲リスト`

- 本シート内で同一曲は存在しない。
- 各同一曲について「最新楽曲」1件のみを保持する。
- 最新楽曲の判定:
  1. 区分優先: `歌ってみた` > `歌枠` > `ショート`
  2. 同一区分内では `publishedDate8` が新しい方を優先
- 旧データはこのシートに残さず、`アーカイブシート` 側で保持する。

### 5.2 `アーカイブシート`

- 過去データ保管用シート。
- 同一曲が複数回出現することを許容する。
- ただし `sourceUrl` の重複は許容しない（スプレッドシート全体ルール）。

## 6. 正規化レコード schema（固定）

```json
{
  "sourceSheet": "songs",
  "sourceSheetLabel": "歌った曲リスト",
  "artist": "",
  "title": "",
  "tagsRaw": "歌枠,アニソン",
  "tags": ["歌枠", "アニソン"],
  "primaryKind": "歌枠",
  "sourceTitle": "20260101 ...",
  "sourceUrl": "https://www.youtube.com/watch?v=...&t=123",
  "publishedDate8": "20260101",
  "publishedDate": "2026-01-01",
  "youtubeVideoId": "...",
  "timestampRaw": "123",
  "timestampSeconds": 123,
  "sameSongKey": "artist\u001ftitle",
  "rowNumber": 4,
  "rowId": "songs|4|<sha1-12>"
}
```

補足:
- `sourceSheet` は `songs` または `archive`。
- `sameSongKey` は `artist + "\u001f" + title` の完全一致キー。
- `rowId` は `sourceSheet|rowNumber|sha1(artist|title|sourceUrl)` の deterministic 値。

## 7. JSONP 出力契約（R2アップロード前提）

- callback 名（固定）: `__UTAWAKU_DB_JSONP__`
- `version`: `1`

### 7.1 songs（歌った曲リスト由来）

- 出力先: `public-data/songs.js`
- payload:
  - `type: "songs"`
  - `generatedAt`
  - `count`
  - `records`

### 7.2 archive manifest（アーカイブ索引）

- 出力先: `public-data/archive-manifest.js`
- payload:
  - `type: "archive-manifest"`
  - `generatedAt`
  - `totalCount`
  - `chunkSize`
  - `chunks: [{ path, index, count }]`

### 7.3 archive chunks（アーカイブ本体分割）

- 出力先: `public-data/archive-chunks/archive-0001.js` 形式で連番。
- payload:
  - `type: "archive-chunk"`
  - `generatedAt`
  - `chunkIndex`
  - `count`
  - `records`

> archive は大容量化を前提に、manifest + chunk で全件を欠損なく配布する。

## 8. 検証ルール

最低限の検証:
- ヘッダが `A3:D3` で一致する
- 対象シート2枚が存在する
- `C` は ASCII カンマ `,` でのみ split
- primary kind（歌ってみた/歌枠/ショート）を必ず含む
- `D` の表示文字列先頭8桁から `publishedDate8` が抽出できる
- `D` のハイパーリンクURLが存在する
- `sourceUrl` 重複がない（全シート横断）
- `歌った曲リスト` 内 same-song 重複がない
- `歌った曲リスト` が最新楽曲ルールに一致する（不一致は warning）

## 9. R2 / GitHub Actions 契約

必須 Secrets / Variables（プレースホルダ）:
- `CF_ACCOUNT_ID`
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_BUCKET`
- `CF_R2_ENDPOINT`
- `CF_R2_PUBLIC_BASE_URL`
- `GAS_WEB_APP_URL`

アップロード対象:
- `public-data/**/*.js`（songs + archive manifest + archive chunks 全件）

## 10. 未確定（[TBD]）

- GAS Web App の本番URL
- R2 バケット名 / 公開URL
- archive の実運用 chunk サイズ（初期値 1000）

## 11. GAS転記用ファイル

- 転記専用ファイル: `gas/Code.deploy.gs`
- そのままGASエディタへ貼り付け、ウェブアプリとしてデプロイする。
- エンドポイント:
  - `GET /exec?mode=exportContractV1`（JSON）
  - `GET /exec?mode=exportContractV1&callback=__UTAWAKU_DB_JSONP__`（JSONP）
- レスポンスには `warnings` 配列を含め、ヘッダ不一致・URL欠落・URL重複を通知する。

