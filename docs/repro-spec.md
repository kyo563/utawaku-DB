# Utawaku-DB 再現仕様書

## 1. アプリの目的

Utawaku-DB は、歌枠履歴を検索可能な静的DBとして提供し、曲名・アーティスト名・配信導線に短時間で到達できることを目的とする。

## 2. 採用アーキテクチャ

- Spreadsheet を一次情報源にする
- 公開は static JSON を優先する
- フロントは静的HTML + vanilla JS
- 失敗時のみ GAS API をフォールバック利用

## 3. ファイル責務

- `index.html`: UI土台、meta設定
- `src/app.js`: 起動/イベント/状態反映
- `src/config.js`: 文言・種別順
- `src/data-source.js`: static→gas の読込制御
- `src/render.js`: 描画
- `src/state.js`: 状態コンテナ
- `src/utils.js`: 正規化/抽出/重複除去
- `public-data/*.json`: 配布データ
- `gas/Code.gs`: Spreadsheet読取API
- `scripts/validate-json.mjs`: JSON検証

## 4. GAS API仕様

エンドポイント（GET）:
- `/exec?sheet=songs`
- `/exec?sheet=gags`
- `/exec?sheet=archive`

パラメータ:
- `q`: 部分一致（artist/title）
- `artist`: アーティスト条件
- `title`: 曲名条件
- `exact=true|false`: 厳密一致切替
- `limit`: 取得件数（1〜500）
- `offset`: 取得開始位置
- `callback`: 指定時JSONP

レスポンス（JSON）:

```json
{
  "ok": true,
  "sheet": "songs",
  "total": 123,
  "limit": 100,
  "offset": 0,
  "items": [
    {
      "artist": "...",
      "title": "...",
      "kind": "歌枠",
      "dText": "2026-04-01",
      "dUrl": "https://...",
      "date8": "20260401",
      "rowId": "songs|2|..."
    }
  ]
}
```

## 5. JSON仕様

### 5.1 基本レコード

- `artist`
- `title`
- `kind`
- `dText`
- `dUrl`
- `date8`
- `rowId`

### 5.2 フロント派生値

- `displayDate`
- `timestampSeconds`
- `videoId`
- `sourceType`
- `normalizedArtist`
- `normalizedTitle`

### 5.3 kind

- `歌枠`
- `歌ってみた`
- `ショート`
- `企画 / 一発ネタ`
- `アーカイブ系`

## 6. スプレッドシート列定義

対象シート:
- `songs`
- `gags`
- `archive`

列（推奨、1行目ヘッダ）:
- `artist`
- `title`
- `kind`
- `dText`
- `dUrl`
- `date8`
- `rowId`

補足:
- 2行目以降をデータ行とする
- `date8` 未入力時は `dText` から抽出
- `rowId` 未入力時は GAS で安定生成

## 7. エラーハンドリング方針

- static JSON 読込失敗時: GAS API へ再試行
- GAS も失敗時: 画面上に失敗理由を表示
- JSON形式不正時: 読込エラーとして扱う

## 8. 命名ルール

- JS変数: `camelCase`
- JSONキー: 既存契約を維持（今回の基本レコード名）
- ファイル名: 小文字 + ハイフン/拡張子を明確にする

## 9. 今後の拡張ポイント

- `gags` / `archive` のUI切替タブ
- CSV/Spreadsheet からの自動同期スクリプト
- 詳細検索（期間・配信URLドメイン）
- 配信者別テーマの設定ファイル化

## 10. 参照元との差分

- 固有配信者向け文言を削り、汎用文言へ置換
- 初期段階では songs中心のUIに限定
- gimmickは最小、追加余地のみ残す

## 11. 既知の制約

- 参照元の全UI演出は未移植
- Spreadsheet列の厳密運用ルールは実データ側で要最終確定
- GAS `extractUrl_` は一般URL抽出であり、全リンク形式を完全保証しない

