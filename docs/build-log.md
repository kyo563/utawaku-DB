# build-log

## 2026-04-07

### 変更内容
- `AGENTS.md` を追加し、リポジトリ運用方針と実装制約を明文化。
- `docs/repro-spec.md` を追加し、再現仕様（スプレッドシート→JSON→R2→HTML）を文書化。
- `AGENTS.md` の Coding Style に命名規則を追記し、命名方針を確定。

### 変更理由
- 第三者やAIエージェントが、同じ方針で再現・保守できるようにするため。

### 影響ファイル
- `AGENTS.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

### 注意点
- 仕様書は草案を含むため、実データの確定後に列定義・JSONキー・R2公開情報を追記すること。

## 2026-04-07 (docs replacement for Codex-safe finalization)

### 変更内容
- `AGENTS.md` を、Codex の安定運用向けに整理した最終版の指示文へ置き換え。
- `docs/repro-spec.md` を、会話ノイズを含まない整理済み最終仕様へ置き換え。

### 変更理由
- 再現性を高め、AI エージェントの誤読を減らすため。

### 影響ファイル
- `AGENTS.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

### 注意点
- スプレッドシート ID、R2 バケット名、公開 URL、デプロイコマンドなどの実値は、明示定義されるまで `[TBD]` のまま扱うこと。
