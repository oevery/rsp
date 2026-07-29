# 核心概念

RSP 把 open work、durable truth、lasting rationale、scoped instructions 和 completed history 分开。这种分层让仓库上下文可发现，同时避免每份 artifact 都成为第二套事实源。

## Artifact foundation

```text
.rsp/
├── rsp-rules.md
├── specs/
│   ├── 00-index.md
│   ├── design.md
│   └── decisions/
├── changes/
├── focus.d/
└── archives/
```

- `.rsp/rsp-rules.md` 是生成的工具无关 fallback protocol；Skill 可用时优先使用 `rsp` Skill。
- `.rsp/specs/` 保存 durable current facts 与 agreed design。所有 `00-index.md` 都是生成的 direct-child navigation，不是可编辑事实 owner。
- `.rsp/specs/decisions/` 是默认的权威 Decision Record 目录，保存长期理由、备选方案、权衡和后果。
- `.rsp/changes/` 保存 open work。每个可执行 Change 都是单个 Markdown 文件。
- `.rsp/focus.d/` 包含选择当前工作的空 marker 文件。
- `.rsp/archives/` 保留已完成 Change 的历史。

稳定且有作用域的工作流与验证指令属于 nearest project-owned `AGENTS.md`，位于 RSP managed block 之外。

## 一个 Change，一个结果

一个 Change 拥有一个可观察结果，以及共享的 acceptance、verification、review、archive 和 rollback 边界。它保留 canonical Proposal、Spec、Design、Tasks、Verify 与 Blockers section。

让 Change 成为当前计划和最终决定性证据的收敛快照。临时探针、调试过程和日常命令流水属于工作会话，不属于 durable artifacts。

Change 名称可以是 flat（`<change>`），也可以是一级 grouped child（`<group>/<change>`）；递归工作目录无效。下面的精确 blocker 行声明依赖：

```md
- requires `<change-work-ref>`: <reason>
```

RSP 不会从自由文本中猜测依赖边。

## Groups

Change Group 是唯一的 composite work shape。不可执行的 `<group>/brief` 实体存储为 `<group>/00-brief.md>`，拥有至少两个 direct child Changes 共享的 goal、constraints、declared slices、completion conditions、durable outcomes 与 group blockers。

先创建 Group，再创建 children。每个 child 独立 focus、verify、review 和 archive。所有声明 child 完成后才能关闭 Group。重开已关闭 Group 或 archived Change 是显式恢复操作，不会改写 Git 或 publication history。

## Lifecycle 与 durable review

持久化 lifecycle 有意保持很小：

```text
open → archived
```

Readiness、blockers、recommended actions、group health 与 managed state 都是派生结果，不是存储状态。Archive 前需要独立完成两个语义判断：

1. 已实现的当前事实或作用域指令是否需要现有或新的 durable owner？
2. 长期理由是否值得写入 Decision Record？

Archive 是历史保留，不是自动提升。Change `Spec` delta markers 是规划辅助；`rsp archive` 不会把它们复制到 Specs 或 Decision Records。

Decision Record 路由见[配置](./reference/configuration.md)，操作步骤见[日常工作流](./guides/daily-workflow.md)。
