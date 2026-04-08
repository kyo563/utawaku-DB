# Spreadsheet / JSONP / R2 具体仕様（v1）

## 1. 対象スプレッドシート

- URL: https://docs.google.com/spreadsheets/d/1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o/edit?gid=0#gid=0
- Spreadsheet ID: `1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o`
- 対象シート（固定）:
  - `歌った曲リスト`
  - `アーカイブシート`

## 2. シート契約

- ヘッダ開始位置: `A3`
- 列定義:
  - `A`: アーティスト名
  - `B`: 曲名
  - `C`: 区分（ASCIIカンマ`,`区切りタグ）
  - `D`: 出典元情報(直リンク)（表示文字列 + ハイパーリンクURL）

### 2.1 C列（区分）

- 分割は ASCII カンマ `,` のみ。
- 例: `歌枠,アニソン`, `ショート,ボカロ,平成`
- 1レコードにつき、以下 primary kind のいずれかを必ず含む。
  - `歌ってみた`
  - `歌枠`
  - `ショート`
- `primaryKind` は、タグ配列の先頭から見て最初に見つかった primary kind。

### 2.2 D列（出典元情報(直リンク)）

- URLは表示文字列ではなく「ハイパーリンク本体」を使用。
- タイムスタンプ付きURLはそのまま保持（削除しない）。
- 表示文字列の先頭8桁 `yyyymmdd` を日付の唯一の正とする。
- 派生:
  - `publishedDate8`: `yyyymmdd`
  - `publishedDate`: `yyyy-mm-dd`
- 先頭8桁が取れない場合は検証エラーとして扱い、日付を補完しない。

## 3. 定義

### 3.1 Same song

以下が完全一致したときのみ同一曲:
- アーティスト名（A列）
- 曲名（B列）

### 3.2 Duplicate data

以下が完全一致したときのみ重複データ:
- `sourceUrl`（D列の実URL。タイムスタンプを含め完全一致）

## 4. シート意味

### 4.1 `歌った曲リスト`

- same-song ごとに最新代表1件のみ。
- 同一曲の複数行は不正（検証対象）。
- 最新判定の優先順:
  1. `歌ってみた`
  2. `歌枠`
  3. `ショート`
- 同優先順内は `publishedDate8` の新しい方を優先。
- ただし、このシート自体をユーザーが正として管理するため、自動修正はしない。

### 4.2 `アーカイブシート`

- 旧データ。
- same-song の複数行を許容。

## 5. 正規化レコード schema（固定）

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
- `sameSongKey` は `artist + "\u001f" + title`（完全一致ベース）。
- `rowId` は `sourceSheet|rowNumber|sha1(artist|title|sourceUrl)` の deterministic 値。

## 6. JSONP 出力契約

- callback 名（固定）: `__UTAWAKU_DB_JSONP__`
- `version`: `1`

### 6.1 songs

- `public-data/songs.js`
- payload:
  - `type: "songs"`
  - `generatedAt`
  - `count`
  - `records`

### 6.2 archive manifest

- `public-data/archive-manifest.js`
- payload:
  - `type: "archive-manifest"`
  - `generatedAt`
  - `totalCount`
  - `chunkSize`
  - `chunks: [{ path, index, count }]`

### 6.3 archive chunks

- `public-data/archive-chunks/archive-0001.js` 形式で連番。
- payload:
  - `type: "archive-chunk"`
  - `generatedAt`
  - `chunkIndex`
  - `count`
  - `records`

## 7. 検証ルール

最低限の検証:
- ヘッダが `A3:D3` で一致する
- 対象シートが2つだけ存在する
- `C` は ASCII カンマでのみ split
- primary kind を1つ以上含む
- `D` 表示文字列の先頭8桁日付
- `D` の実URLが存在
- URL重複検出（完全一致）
- `歌った曲リスト` 内 same-song 重複検出
- 任意チェック: songs より高優先/新しい候補が archive にある場合は warning を出す（自動修正しない）

## 8. R2 / GitHub Actions 契約

必須 Secrets / Variables（プレースホルダ）:
- `CF_ACCOUNT_ID`
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_BUCKET`
- `CF_R2_ENDPOINT`
- `CF_R2_PUBLIC_BASE_URL`
- `GAS_WEB_APP_URL`（必要時）

アップロード対象:
- `public-data/**/*.js`（songs + archive manifest + 全archive chunk）

## 9. 未確定（[TBD]）

- GAS Web App の本番URL
- R2 バケット名 / 公開URL
- archive の実運用 chunk サイズ（初期値 1000）
