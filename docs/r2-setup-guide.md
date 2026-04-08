# Cloudflare R2 セットアップガイド（Spreadsheet / JSONP 連携）

このガイドは、`docs/sheets-jsonp-r2-spec.md` と `.github/workflows/publish-jsonp-r2.yml` を基準に、
**R2に入力すべき値**と**立ち上げ手順**を最小構成でまとめたものです。

---

## 1. 先に確定しておく値

### Spreadsheet / GAS 側

- Spreadsheet ID: `1C7p-n_WZZXPQeXXd_c5jTPnzEo4cbzKKsUg4SngbG6o`
- GAS Web App URL（デプロイ後に発行される `/exec` URL）
- エクスポートURL（実際にGitHub Actionsが叩くURL）
  - `https://<your-gas-webapp>/exec?mode=exportContractV1`

> 注意: `mode=exportContractV1` を付けないと、ワークフロー契約と一致しません。

### R2 側

- バケット名（例: `utawaku-db-prod`）
- 公開ベースURL（例: `https://pub-xxxxx.r2.dev` または独自ドメイン）
- S3 API用エンドポイント（例: `https://<accountid>.r2.cloudflarestorage.com`）
- R2 APIトークンから発行した Access Key ID / Secret Access Key

---

## 2. Cloudflare R2 の立ち上げ手順

1. Cloudflare ダッシュボード → **R2** → **Create bucket**。
2. バケット名を作成（`CF_R2_BUCKET` に入れる値）。
3. **Manage R2 API tokens** でトークン作成。
4. トークンから **Access Key ID / Secret Access Key** を発行。
5. バケット公開方法を決める。
   - まずは `r2.dev` 公開でOK（後で独自ドメインへ変更可）。
6. S3 API エンドポイントを控える。
   - `https://<accountid>.r2.cloudflarestorage.com`

---

## 3. GitHub Secrets / Variables に入力する値

このリポジトリのワークフロー（`publish-jsonp-r2.yml`）で必要な値です。

| 名前 | 入力する内容 | どこで取得するか |
|---|---|---|
| `GAS_WEB_APP_URL` | GASの `/exec` URL（クエリなし） | GASデプロイ画面 |
| `CF_R2_ACCESS_KEY_ID` | R2 Access Key ID | Cloudflare R2 API token |
| `CF_R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | Cloudflare R2 API token |
| `CF_R2_BUCKET` | バケット名 | Cloudflare R2 bucket |
| `CF_R2_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` | Cloudflare R2 S3 API |
| `CF_R2_PUBLIC_BASE_URL` | 公開ベースURL（`https://...`） | `r2.dev` or 独自ドメイン |

---

## 4. 実際にアップロードされるパス

ワークフローは `public-data/**/*.js` を、R2の以下に配置します。

- `s3://$CF_R2_BUCKET/public-data/songs.js`
- `s3://$CF_R2_BUCKET/public-data/archive-manifest.js`
- `s3://$CF_R2_BUCKET/public-data/archive-chunks/archive-0001.js` など

つまり、公開URLは概ね以下になります。

- `${CF_R2_PUBLIC_BASE_URL}/public-data/songs.js`
- `${CF_R2_PUBLIC_BASE_URL}/public-data/archive-manifest.js`

---

## 5. 最小チェック手順

1. GitHub Actions で `publish-jsonp-r2` を手動実行。
2. Actionsログで以下を確認。
   - `Fetch spreadsheet export JSON` が成功
   - `Generate JSONP files` が成功
   - `Upload JSONP to Cloudflare R2` が成功
3. ブラウザで公開URLを開き、JSONPが返ることを確認。
   - 例: `${CF_R2_PUBLIC_BASE_URL}/public-data/songs.js`

---

## 6. よくあるエラー

- `GAS_WEB_APP_URL` 未設定 / URL誤り
  - `?mode=exportContractV1` でJSONが返るか先に確認。
- `CF_R2_ENDPOINT` 誤り
  - `https://<accountid>.r2.cloudflarestorage.com` 形式か確認。
- キー権限不足
  - 対象バケットへ `PutObject` 相当の権限があるか確認。
- `CF_R2_PUBLIC_BASE_URL` は設定したが公開設定が無効
  - `r2.dev` 公開または独自ドメイン公開設定を確認。

