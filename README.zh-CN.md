# RSP：Rules, Specs, Plans

[English](./README.md) | 简体中文

RSP = **Rules、Specs、Plans**。这是一个面向长期项目知识与单文件 change 跟踪的轻量级 AI 协作工作流。

## 快速开始

```bash
npx -y @oevery/rsp init
npx -y @oevery/rsp doctor
```

推荐启动流程：

```bash
npx -y @oevery/rsp init --with-project-setup
# 填写 .rsp/changes/project-setup.md
# 填写 .rsp/specs/design.md
npx -y @oevery/rsp doctor
```

## 核心思路

- `rules/` 存放长期稳定的约束。
- `specs/` 存放项目级 source-of-truth 文档。
- `changes/` 以单文件格式存放 open work。
- `focus.d/` 用空标记文件镜像当前聚焦的 changes。
- `archives/` 存放已完成工作。

```text
.rsp/
├── rules/
│   ├── rsp-rules.md
│   └── project-rules.md      # 可选
├── specs/
│   ├── INDEX.md              # 自动生成
│   └── design.md
├── changes/
│   └── <name>.md
├── focus.d/
│   └── <name>
└── archives/
    └── INDEX.md              # 自动生成
```

## 概念

- `specs/` 描述长期稳定的项目事实和当前认可的设计。
- `changes/` 描述 open work，包括 feature、fix、refactor、docs、ops 和 research。
- 每个 change 始终是单个 Markdown 文件，并包含 proposal、spec、design、tasks、verification 与 blockers 等明确 section。
- 完成后的 change 会移动到 `archives/`；若变更产出了长期知识，应在归档前同步写入 `specs/` 或 `rules/`。
- 所谓长期知识，只应包含稳定事实；不要把任务历史、排障笔记或一次性实现上下文提升到 `specs/` 或 `rules/`。
- Change `Spec` 中的 delta 标记（`### ADDED`、`### MODIFIED`、`### REMOVED`）仅为规划辅助标记。`rsp archive` 不会自动将它们合并到 `specs/` 或 `rules/` 中。长期知识的写入始终是高显式语义决策。
- `rsp check` 会执行 deterministic 的卫生检查。它会对未完成的模板占位符和未解决的 clarification 标记发出 warning，但这些 warning 不会替代 durable update 的语义判断。

## 文件所有权

- `AGENTS.md`：只有 `<!-- rsp:begin --> ... <!-- rsp:end -->` 受管块由 RSP 维护。
- `.rsp/specs/INDEX.md`：自动生成，用于索引 `design.md` 之外的附加 spec 文件；使用 `rsp update` 重建。
- `.rsp/archives/INDEX.md`：自动生成，使用 `rsp update` 重建。
- `.rsp/specs/design.md`：由 `rsp init` 创建，之后由项目维护。
- `.rsp/rules/project-rules.md`：可选，仅在项目确有长期本地规则时创建。
- 将长期架构、边界和跨模块技术约束放在 `.rsp/specs/design.md`。
- 将 `.rsp/specs/INDEX.md` 视为附加 spec 的目录；它不列出 `design.md`。
- 将稳定的工作流规则、验证要求和本地运行约束放在 `.rsp/rules/project-rules.md`。

## AGENTS 接入

受管块示例：

```md
<!-- rsp:begin -->
## RSP Entry

RSP keeps durable rules, specs, and current work under `.rsp/`.
Treat AGENTS.md as navigation only; keep durable rules and design in `.rsp/`.

Read in order:
1. .rsp/rules/rsp-rules.md
2. .rsp/focus.d/
3. matching .rsp/changes/*.md for the focused entries
4. .rsp/specs/design.md
5. .rsp/specs/INDEX.md
6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
If your agent supports Agent Skills, load `rsp` for setup, repair, and durable-decision tasks.
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`：

- `managed`：在需要时创建 `AGENTS.md`，并插入或更新受管块。
- `print`：正常初始化，并额外打印最终的 `AGENTS.md` 内容。

## Skill

使用 `skills/rsp/SKILL.md` 获取逐步的 setup、workflow 和审查指导。它适合按需加载，而不是默认常驻。

文档分层矩阵：

| Surface | 主要受众 | 职责 |
|---|---|---|
| `README.md` | 人类 | 概览、入门、示例 |
| `.rsp/rules/rsp-rules.md` | agent | 规范性的规则真相源 |
| `skills/rsp/SKILL.md` | agent | 应用这些规则的操作指南 |
| `AGENTS.md` | 人类与 agent | 帮助找到正确文件的导航入口 |

通常应由人先读 `README.md`，而 agent 应把 `.rsp/rules/rsp-rules.md` 当作规范真相源。

如果文档中写的是 `rsp <command>`，默认前提是你的环境里已经能直接运行 `rsp`；否则请使用 `npx -y @oevery/rsp <command>`。

可选安装示例：

```bash
npx skills add oevery/rsp
```

本仓库发布了一个名为 `rsp` 的 skill，位于 `skills/rsp/`。

`rsp update` 只会刷新项目内的 RSP 文件。如果你在使用发布出来的 RSP skill，升级后还需要单独刷新一次：

```bash
npx skills add oevery/rsp
```

## 工作模型

```text
open → archived
```

各目录职责应保持单一且明确：

- `changes/`：open changes
- `focus.d/`：当前聚焦的 changes
- `archives/`：完成后的历史

在 `open` 阶段，常见活动包括：

- `create`：创建并界定一个 change。
- `focus` / `unfocus`：调整当前聚焦的 open change。
- 直接编辑 change 文件，填写 section、勾选 tasks、记录设计决策。
- 在归档前判断是否需要 durable updates。

实现过程中，应保持 change 文件与实际工作同步：代码完成后勾选对应的 `## Tasks`，在 `## Verify` 中记录实际运行的检查；如果实现发现设计不成立，应先更新 `## Design` 再继续。

`archive` 会把已完成的工作归档到历史。`archive` 不会阻塞，只会给出 warning，最终判断留给 agent 或人工。

agent 应只把 `focus.d/` 中列出的 change 视为当前工作。`changes/` 中未聚焦的文件仍然是 open，但除非用户明确要求或重新 `focus`，否则不应被当作当前目标。

关于 durable update 的决定，也就是某次变更是否产出了应该写入 `.rsp/specs/` 或 `.rsp/rules/` 的知识，本质上是语义判断，应由 RSP skill 或人工 reviewer 完成。

`rsp ready` 和 `rsp show` 会同时暴露 deterministic readiness 与 semantic-review 信号。deterministic readiness 来自 checkbox、blocker 和 scenario；durable update 仍然需要语义 review。

`rsp ready --json` 和 `rsp show --json` 还会包含 `durableReview` 指导信息，其中包括固定决策选项和候选 durable target。这只是 review 指导；RSP 不会自动把 change `Spec` delta 合并进 durable 文件。

## 推荐工作流

新项目：

1. `npx -y @oevery/rsp init`
2. 优先使用 `npx -y @oevery/rsp init --with-project-setup`，或手动执行 `rsp create project-setup`
3. 填写 `.rsp/specs/design.md`
4. 仅在需要新的长期项目文档时使用 `rsp add spec <name>`
5. 仅在项目存在稳定本地规则时使用 `rsp add rules project-rules`
6. 对需要跟踪的 open work，使用 `rsp create <name>` 开始
7. 如果要让某个已有 open change 成为当前工作，使用 `rsp focus <name>`
8. 如果要将某个 change 移出当前焦点集合，使用 `rsp unfocus <name>`
9. 直接编辑 change 文件并完成实现、勾选 tasks
10. 使用 RSP skill 或人工 review 判断是否需要 durable updates
11. 使用 `rsp archive <name>` 收尾

已有复杂 `AGENTS.md` 的项目：

1. `npx -y @oevery/rsp init`
2. 保持受管块尽量薄
3. 将长期设计收敛到 `.rsp/specs/design.md`
4. 需要时再使用 `rsp add spec <name>` 或 `rsp add rules <name>`

AI 协助接入：

1. `npx -y @oevery/rsp init --agents-mode print --with-project-setup`
2. 保持受管块原样，只在需要时调整周围由人维护的内容
3. 让 AI 审阅并填写 `.rsp/changes/project-setup.md`
4. 让 AI 填写 `.rsp/specs/design.md`
5. 运行 `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   搭建 .rsp/，并确保 AGENTS.md 含有 RSP 入口块
rsp init --with-project-setup   同时创建 .rsp/changes/project-setup.md
rsp update                      升级后刷新 rules、修复 AGENTS 受管块并重建各类索引
rsp add rules <name>            创建 .rsp/rules/<name>.md
rsp add spec <name>             创建 .rsp/specs/<name>.md 并重建 specs 索引
rsp create <name> [summary]     创建 .rsp/changes/<name>.md；可加 --lite 使用更短模板
rsp focus <name>                将一个 open change 标记为当前聚焦
rsp unfocus <name>              将一个 open change 移出当前聚焦集合
rsp archive <name>              归档到 .rsp/archives/ 并更新 archive index
rsp archive --dry-run <name>    预览归档就绪状态，不移动 change
rsp ready <name> [--json] [--verbose]
                                   预览归档就绪状态（与 archive --dry-run 相同）
rsp show <name|--focused> [--json] [--verbose]
                                   显示 change 上下文，带就绪信号和上下文路径
rsp status [--focused|--blocked|--stale <days>] [--json] [--verbose]
                                   查看带有当前聚焦信息的项目状态摘要，并支持轻量筛选
rsp check [--focused] [--json] [--verbose]
                                   校验 change 文件，并对 template/scenario 结构做轻量 lint
rsp doctor [--fix] [--json] [--verbose]
                                   检查接入健康和常见问题
```

精确规则以 `.rsp/rules/rsp-rules.md` 为准；durable decision 的操作指导以 `skills/rsp/SKILL.md` 为准。

当没有 focused change 时，`rsp status` 和 `rsp show --focused --json` 会输出 `nextActions`，但不会自动猜测哪个 open change 是当前工作。

`rsp create --lite` 是用于显式跟踪小 change 的短模板；简单的当前会话任务默认不应创建 RSP change，除非确实需要跟踪。

`rsp doctor --fix` 只执行安全 deterministic 修复。它的 JSON `fixed` 条目表示实际写入的文件系统变化；健康项目会返回 `fixed: []`，human 输出会说明无需安全修复。

## 工具无关

`.rsp/` 是纯文件约定，适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 助手。需要 Node.js 18+。
