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
