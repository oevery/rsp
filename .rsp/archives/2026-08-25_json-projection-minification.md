---
kind: "refactor"
---

# Change: json-projection-minification

## Proposal
- Outcome: 精简默认 JSON 投影并分层输出表面
- Why:
  - 当前 `status --json` 同时返回机器门禁、plain 提示、历史趋势和 runtime 诊断；`--compact` 只移除空白，未降低语义负担。
  - 让 TUI/plain 承担人类与 AI 的默认语义读取，让默认 JSON 聚焦可被精确消费的当前工作事实。
- Scope:
  - 精简 `status --json` 默认投影；保留依赖、Change、Group、摘要和结构化诊断等机器事实。
  - 将 `nextActions`、`archiveTrend`、`runtime` 和重复的 `plan.ready` 降级到 verbose/专门查询或从默认投影移除。
  - 更新 status JSON 类型、投影、CLI 测试、Skills 与中英文 CLI/维护者文档。
- Non-goals:
  - 不删除 JSON 能力，不改 plain/TUI 的工作流语义。
  - 不压缩键名，不新增第二份持久化状态，不修改其他命令的 JSON 契约。
  - 不进行 CI、发布、远程 Git 或外部消费者迁移。

## Spec
### MODIFIED
- Requirement: 默认 `status --json` 是最小机器事实投影。
  - 必须保留 `command`、`ok`、`focused`、`records`、`groups`、`summary`、依赖节点/边/阻塞/waves 和非空结构化 `diagnostics`。
  - 默认不得返回仅面向人类的 `nextActions`、历史 `archiveTrend` 或 runtime 诊断；重复的 `plan.ready` 不再作为默认字段。
  - `--verbose --json` 可返回被降级的辅助信息，且 plain/TUI 继续提供人类可读提示。
- Requirement: 精简投影保持依赖和收尾判断完整。
  - `plan.nodes`、`plan.edges`、`plan.blocked`、`plan.waves` 必须继续支持 prerequisite closure、阻塞原因和执行顺序判断。
  - `ready` 的语义由首个非空 wave 投影恢复，不得改变依赖推导或生命周期门禁。

### Acceptance
#### Scenario: 默认状态 JSON 聚焦当前工作事实
- GIVEN 一个包含 focused Change、Group、依赖边和阻塞原因的有效 RSP 项目
- WHEN 执行 `rsp status --json`
- THEN 输出保留当前工作、Group、摘要、依赖节点/边/阻塞/waves 和结构化诊断，并省略 `nextActions`、`archiveTrend`、`runtime` 与重复的 `plan.ready`

#### Scenario: verbose JSON 保留辅助诊断
- GIVEN 一个存在 runtime 诊断或历史趋势的有效 RSP 项目
- WHEN 执行 `rsp status --json --verbose`
- THEN 输出包含默认机器事实以及被降级的过滤器、下一步、历史趋势和 runtime 诊断

#### Scenario: 依赖事实不因投影精简丢失
- GIVEN 一个有 prerequisite closure、多个执行 wave 和 blocked Change 的项目
- WHEN 执行默认 JSON 状态查询
- THEN Agent 仍能从 nodes、edges、blocked 和 waves 判断依赖方向、阻塞原因和执行顺序

#### Scenario: plain 和 TUI 保持原有语义
- GIVEN 同一个状态项目
- WHEN 执行 `rsp status` 或打开 `rsp ui`
- THEN 人类可读摘要、下一步和必要的历史/诊断展示不因 JSON 投影精简而消失

## Design
- Approach:
  - 为 `toStatusJson` 增加默认/verbose 两种投影，默认只输出机器事实；不改变内部 `ProjectStatusView`。
  - 从 `ChangeDependencyPlanOutput` 中移除默认 JSON 的 `ready` 重复投影，但保留内部计算和 waves。
  - 仅在有值时输出诊断类可选字段；错误响应仍保持可机器处理且包含 error。
- Boundaries:
  - plain/TUI 是人类与 AI 的默认语义表面；JSON 是显式精确消费表面。
  - `rsp ready --json`、`rsp show --json` 等收尾/持久化检查契约不在本 Change 内改变。
  - 该 Change 只负责 status JSON projection，不负责外部脚本或发布迁移。
- Affected areas:
  - `src/status/v3-json.ts`、`src/types.ts`、status presenter/CLI 参数路径和相关集成测试。
  - `skills/rsp*` 中 status JSON 使用说明，以及 `docs/maintainers/design-philosophy.md`、中英文 CLI 文档。
- Constraints:
  - 保留 plain/TUI 行为、现有依赖推导、诊断代码和 JSON 单文档/LF 终止约定。
  - 不通过缩短键名或不可解释的字段别名换取 Token 节省。

## Tasks
- [x] 更新 status JSON 类型与默认/verbose 投影，确保错误路径一致。
- [x] 更新 status、依赖图和 compact JSON 集成测试，锁定默认字段集合及 verbose 辅助字段。
- [x] 更新 Skills 与中英文文档，明确 TUI/plain/JSON 的分层职责。
- [x] 解决 fixed-scope review 的过滤器自描述和 `--verbose` help findings。
- [x] 运行 focused RSP check、构建、lint、测试和 `git diff --check`。

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — proves: production TypeScript/CLI build succeeds.
  - [x] `mise exec -- pnpm run typecheck` — proves: the public status JSON type matches the runtime projection.
  - [x] `mise exec -- pnpm run lint` — proves: changed source and authored Skills satisfy repository lint.
  - [x] `mise exec -- pnpm run test` — proves: status JSON, dependency, CLI and Skill contracts remain valid; 92 files and 891 tests passed on August 25, 2026.
  - [x] `node dist/cli.mjs check --focused` — proves: the selected Change remains structurally valid.
  - [x] `git diff --check` — proves: no whitespace errors in the scoped diff.
### Optional
- Manual or environment:
  - [x] Compare `rsp status`, `rsp status --json`, and `rsp status --json --verbose` on a populated fixture — confirms the three presentation layers are understandable.
- Coverage:
  - Browser, external CI, remote scripts, and publication consumers are not exercised.

## Blockers
- none
