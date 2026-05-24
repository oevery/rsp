# RSP：Rules, Specs, Plans

[English](./README.md) | 简体中文

RSP = **Rules（规则）、Specs（规格）、Plans（计划）**。这是一个面向项目规则、项目级文档和特性计划的轻量级 AI 协作工作流。

## 快速开始

```bash
npx -y @oevery/rsp init
npx -y @oevery/rsp doctor
```

## 核心概念

- `rules/` 存放长期稳定的约束。
- `specs/` 存放项目级设计文档。
- `features/` 存放进行中的工作。
- `active.d/` 用空标记文件镜像活跃特性。
- `archives/` 存放已完成工作。

```text
.rsp/
├── rules/
│   ├── rsp-rules.md
│   └── project-rules.md      # 可选
├── specs/
│   ├── INDEX.md              # 自动生成
│   └── design.md
├── features/
│   └── <name>.md
├── active.d/
│   └── <name>
└── archives/
    └── INDEX.md              # 自动生成
```

## 文件所有权

- `AGENTS.md`：只有 `<!-- rsp:begin --> ... <!-- rsp:end -->` 受管块由 RSP 维护。
- `.rsp/specs/INDEX.md`：自动生成，使用 `rsp specs-index` 重建。
- `.rsp/archives/INDEX.md`：自动生成，使用 `rsp archive-index` 重建。
- `.rsp/specs/design.md`：由 `rsp init` 创建，之后由项目维护。
- `.rsp/rules/project-rules.md`：可选，仅在项目确有长期本地规则时创建。
- 将长期架构、边界和跨模块技术约束放在 `.rsp/specs/design.md`。
- 将稳定的工作流规则、验证要求和本地运行约束放在 `.rsp/rules/project-rules.md`。

## AGENTS 接入

受管块示例：

```md
<!-- rsp:begin -->
## RSP Entry

Read in order:
1. .rsp/rules/*.md
2. .rsp/specs/INDEX.md
3. .rsp/specs/design.md
4. .rsp/active.d/ and matching .rsp/features/*.md
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`：

- `managed`：插入/更新 `AGENTS.md` 中的受管块。
- `skip`：只搭建 `.rsp/`。
- `print`：搭建 `.rsp/` 并打印受管块。

## Skill

更完整的接入步骤、工作流说明和审计说明见 `skills/rsp/SKILL.md`。它适合按需加载，不应替代常驻核心规则。

可选安装示例：

```bash
npx skills add oevery/rsp --skill rsp
```

这个仓库发布的 skill 名称是 `rsp`，位于 `skills/rsp/`。

然后只在接入 RSP、审计设置或整理项目级 rules/specs 时加载这个 skill。

## 推荐工作流

新项目：

1. `npx -y @oevery/rsp init`
2. 创建 `rsp new project-setup`，收集启动事实和初始决策
3. 填写 `.rsp/specs/design.md`
4. 只有在需要长期项目文档时才用 `rsp add spec <name>`
5. 只有在存在稳定本地规则时才用 `rsp add rules project-rules`
6. 使用 `rsp new <name>` 开始工作

已有复杂 `AGENTS.md` 的项目：

1. `npx -y @oevery/rsp init --agents-mode managed`
2. 保持受管块尽量薄
3. 将长期设计收敛到 `.rsp/specs/design.md`
4. 需要时再用 `rsp add spec <name>` 或 `rsp add rules <name>`

AI 协助接入：

1. `npx -y @oevery/rsp init --agents-mode print`
2. 让 AI 处理 `AGENTS.md` 的受管块
3. 让 AI 创建 `rsp new project-setup`
4. 让 AI 填写 `.rsp/specs/design.md`
5. 运行 `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   搭建 .rsp/ + AGENTS.md
rsp add rules <name>            创建 .rsp/rules/<name>.md
rsp add spec <name>             创建 .rsp/specs/<name>.md 并重建 specs 索引
rsp new <name> [summary]        创建 .rsp/features/<name>.md
rsp close <name>                归档到 .rsp/archives/ + 更新归档索引
rsp status [--active|--blocked|--stale <days>]
                                 查看项目状态摘要，并支持轻量筛选
rsp check                       校验 feature 文件结构与依赖一致性
rsp deps [--mermaid|--focus <name>|--reverse <name>]
                                 查看依赖摘要、Mermaid 图或局部依赖视图
rsp doctor                      检查接入健康和常见问题
rsp specs-index                 重新生成 specs 索引
rsp archive-index               重新生成 archives 索引
```

## Doctor

`rsp doctor` 是只读命令。

- 检查 `.rsp/`、`rules/rsp-rules.md`、`specs/design.md`、`specs/INDEX.md`、`archives/INDEX.md` 以及 `AGENTS.md` 受管块。
- 检查自动索引签名。
- 检查 `active.d` 标记与 `features/` 是否一致。
- 发现问题会以非零退出码结束。

## 工具无关

`.rsp/` 是纯文件约定，适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 助手。需要 Node.js 18+。
