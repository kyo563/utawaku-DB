# Utawaku-DB 再現仕様書

## 1. 目的

Spreadsheet を一次情報源として、JSONP を R2 に静的配布し、ブラウザが `<script>` で読める再現可能フローを維持する。

## 2. 今回の確定契約（v1）

このリポジトリでの具体契約は以下に固定する。

- スプレッドシート: `1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o`
- 対象シート: `歌った曲リスト` / `アーカイブシート`
- ヘッダ: `A3:D3`
- 出力形式: JSONP
- 配布先: Cloudflare R2

詳細は `docs/sheets-jsonp-r2-spec.md` を正とする。

## 3. パイプライン

1. Spreadsheet（人手運用）
2. GAS（`gas/Code.gs`）で2シートを抽出
3. `scripts/export-jsonp.mjs` で正規化 + 検証 + JSONP生成
4. GitHub Actions（`.github/workflows/publish-jsonp-r2.yml`）で R2 へ再帰アップロード
5. 静的フロントが JSONP を順次ロード

## 4. 設計原則

- static-first
- 仕様を先に固定
- archive は chunk 分割で欠損/打ち切りを防ぐ
- シートの内容は source of truth として扱い、自動上書きしない

## 5. 非ゴール

- バックエンド常設API化
- 大規模フレームワーク導入
- fuzzy マッチでの同一曲判定
