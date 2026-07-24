# RSP — Reliable Software Practice

[English](./README.md) | 简体中文

**面向人类与 AI Agent 的仓库原生工程工作流。**

RSP 将模糊意图逐步转化为边界明确、经过实现、审查和验证的软件变更，同时让项目知识可以长期维护、让未完成工作可以可靠恢复。九个可组合 Skills 共同覆盖工程旅程，但不引入隐藏 workflow state，也不取代项目自己的文件、工具和权限边界。

这套工作流建立在轻量的 **Rules、Specs、Plans** artifact foundation 之上。

## RSP 帮助你完成什么

- 将模糊工作塑造成一个可执行 Change，或一组彼此独立的小切片。
- 在实现前，根据仓库证据解决关键设计问题。
- 将原因不明的失败交给 diagnosis，将行为清晰的工作交给 TDD，将已有充分证据的修改交给 implementation。
- 按明确范围审查变更、处理已接受的 findings，并重新运行 fresh verification。
- 将稳定事实、作用域指令、长期理由和完成历史分别保存在正确的 owner 中。
- 当 Change 明确拥有已确认的 release 时，准备对应的发布文档。

## 工作流如何组合

```text
意图
  → Shape
  → 按需 Design
  → Diagnose | TDD | Implement
  → Review → Address accepted findings
  → 按需准备 Release Docs
  → Durable Review → Archive
```

RSP 根据 selected Change、仓库证据、验证结果和 blockers 推导下一步动作。每个能力都把结果返回已有的项目或 RSP owner。RSP 不会自行推断修改代码、继续 Git 操作、commit、publish、deploy 或 approve 的权限。

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

## Artifact foundation

`Reliable Software Practice` 表达产品承诺；`Rules、Specs、Plans` 描述让这套工作流保持仓库原生的轻量 artifact model：

- nearest `AGENTS.md` 存放有作用域的项目或模块操作指令。
- `rsp-rules.md` 是最小、tool-agnostic 的 fallback protocol。
- `specs/` 存放项目级 source-of-truth 文档。
- `changes/` 以单文件格式存放 open work。
- `focus.d/` 用空标记文件镜像当前聚焦的 changes。
- `archives/` 存放已完成工作。

```text
.rsp/
├── rsp-rules.md              # 最小 fallback protocol
├── specs/
│   ├── INDEX.md              # 自动生成
│   ├── design.md
│   └── decisions/            # 默认的权威 Decision Records
├── changes/
│   ├── <name>.md
│   └── <group>/
│       ├── 00-brief.md
│       └── <change>.md
├── focus.d/
│   └── <name>
└── archives/
    └── INDEX.md              # 自动生成
```

## 概念

- `specs/` 描述长期稳定的项目事实和当前认可的设计。
- Decision Records 描述难以逆转选择的长期理由、备选方案、取舍和后果；默认位于 `.rsp/specs/decisions/`，也可以配置唯一的外部权威路径。
- `changes/` 描述 open work，包括 feature、fix、refactor、docs、ops 和 research。
- 每个 change 始终是单个 Markdown 文件，并包含 proposal、spec、design、tasks、verification 与 blockers 等明确 section。
- 精确 blocker 行 `- requires \`<change-work-ref>\`: <reason>` 表示依赖另一个可执行 Change。自由文本 blocker 保持为外部阻塞，RSP 不会从 prose 猜测依赖边；前置 Change 归档后依赖会自动解除。
- Change 名称只能是扁平的 `<change>` 或一层直接子项 `<group>/<change>`；递归 work 目录会被拒绝。
- Change Group 是可选且唯一的复合 work 形态。其不可执行、不可 focus 的逻辑身份 `<group>/brief` 在磁盘上存储为 `<group>/00-brief.md`，为至少两个直接子 Change 统一拥有目标、共享约束、slice 声明、整体完成条件、durable outcomes 和 blockers。
- 必须先创建 Group 再创建子 Change。每个 grouped Change 都必须由 brief 声明，独立 focus、独立归档，并将 brief 纳入上下文。没有 focus 时，`status` 按 Brief 声明顺序和当前 blockers 推荐第一个可执行 slice。`status`、`check` 和 `doctor` 从文件事实推导 Group 健康度和完成度，不持久化额外状态；`rsp group close` 只归档已完成的 brief。已归档的 Group 身份不能重新打开。
- Group Brief blocker 会作为外部 blocker 派生到其直接子 Change，但不会生成猜测的依赖边。
- 同一个 work 身份不能同时由 Markdown 文件和目录占用。
- `rsp status`、`rsp check` 和 `rsp doctor` 使用同一套完整 work-tree 与依赖事实检查。`status` 无需 graph 文件即可派生带原因的精确依赖边、ready work、blockers 和稳定 waves；`check` 与 `doctor` 会拒绝不完整的 archive inspection、格式错误或缺失的依赖目标、自依赖与循环。`changes/` 根目录必须存在且是真实目录，已有的 focus/archive 根目录和 group 前缀也必须是真实目录；非法目录、非 Markdown 条目、符号链接、缺失或不可读的当前 work、不完整读取和身份冲突都会成为可见错误。`status` 会返回非零状态，而不是隐藏非法 work。
- `rsp init`、`rsp update`、`rsp add spec` 和生成索引使用相同的 no-follow managed-path 检查。archive discovery 只接受扁平 archive 文件或一层真实 group 目录；递归组织的 Specs 只接受真实目录和普通文件。
- 项目 `AGENTS.md`、focus marker、fallback/config、生成索引和 placeholder 等最终 managed file 也必须是普通文件；RSP 会在读写前拒绝静态 symlink 目标。
- 完成后的 change 会移动到 `archives/`。稳定当前事实写入 Specs；长期理由写入 Decision Records；稳定的作用域操作指令写入 nearest project-owned `AGENTS.md`。
- 不要把任务历史、排障笔记或一次性实现上下文提升到 Specs、Decision Records 或项目指令。
- Change `Spec` 中的 delta 标记仅为规划辅助。`rsp archive` 不会自动将它们提升到 Specs 或 Decision Records。
- `rsp check` 会执行 deterministic 的卫生检查。它会对未完成的模板占位符和未解决的 clarification 标记发出 warning，但这些 warning 不会替代 durable update 的语义判断。

## 文件所有权

- `AGENTS.md`：只有 `<!-- rsp:begin --> ... <!-- rsp:end -->` 受管块由 RSP 维护。
- `.rsp/specs/INDEX.md`：自动生成，用于索引 `design.md` 之外的附加 spec 文件；使用 `rsp update` 重建。
- `.rsp/archives/INDEX.md`：自动生成，使用 `rsp update` 重建。
- `.rsp/specs/design.md`：由 `rsp init` 创建，之后由项目维护。
- `.rsp/specs/decisions/`：默认的权威 Decision Record 目录；只有 Host Project 已有外部 ADR 目录时才配置 `decisions.path`。
- `.rsp/rsp-rules.md`：生成的最小 fallback protocol；可用时优先加载 `rsp` skill。
- 将长期架构、边界和跨模块技术约束放在 `.rsp/specs/design.md`。
- 将 `.rsp/specs/INDEX.md` 视为附加 spec 的目录；它不列出 `design.md`。
- 将稳定且有作用域的工作流、验证和本地运行指令放在 nearest project-owned `AGENTS.md` 的非受管区域。

## Decision Record 路径

默认权威目录是 `.rsp/specs/decisions/`。如果 Host Project 已在其他位置维护 ADR，只配置一个项目相对的外部路径：

```yaml
decisions:
  path: docs/adr
```

该路径不能是绝对路径、不能逃逸 Host Project，也不能指向其他 `.rsp/` 核心位置。`rsp init` 和 `rsp update` 会在写入受管文件前校验路由并确保目录存在，`rsp show` 与 `rsp ready` 会拒绝不安全路由，`rsp doctor` 检查目录可读性和迁移健康；这些命令都不会创建 Decision Record。切换到外部路径不会自动迁移默认目录中的记录；在旧 `.rsp/specs/decisions/*.md` 被迁移或明确删除前，`rsp doctor` 会持续报告问题。

## AGENTS 接入

受管块示例：

```md
<!-- rsp:begin -->
## RSP Entry

RSP tracks current work, stable specs, and archives under `.rsp/`.

Read in order:
1. Nearest `AGENTS.md` for project or module instructions.
2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.
3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.
4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`：

- `managed`：在需要时创建 `AGENTS.md`，并插入或更新受管块。
- `print`：正常初始化，并额外打印最终的 `AGENTS.md` 内容。

## Skills

RSP 发布九个宿主无关、按需加载的 Skills：

- `rsp`：setup、workflow、durable review 和 archive 指导。
- `rsp-shape`：在不实现代码的前提下，将不清晰的非平凡工作塑造成一个 ready Change 或合理的 shallow Group；当用户明确要求严格质询或高风险决策仍未解决时，渐进加载 deep clarification，并让关键设计问题通过同一个 WorkRef 返回。
- `rsp-design`：根据项目证据解决一个受跟踪的 domain model、module/seam 或 reversible exploration 问题，只把已授权的 planned design 写回 selected Change。
- `rsp-implement`：在显式 mutation authority 内实现一个 selected、ready Change，并如实回写 Tasks、Blockers 和 fresh verification evidence。
- `rsp-diagnose`：在生产修复前确认原因，或如实返回 unresolved diagnosis。
- `rsp-tdd`：让一个清晰行为经过 observed RED、minimal GREEN、可选 safe REFACTOR 与 fresh verification。
- `rsp-review`：基于固定范围与项目权威，对 Code、Document 或 mixed Change 进行只读审查。
- `rsp-address-review`：处置固定 review findings，仅修复已授权且 accepted 的 finding，并要求 fresh verification 与 report-only re-review。
- `rsp-release-docs`：根据证据准备或审计 Changelog、Release Notes 和 Migration Notes，并适配用户要求与仓库现有约定。

每个 Skill 都可以独立调用，并把结果返回现有项目或 RSP artifact owner。套件不引入隐藏 workflow state 或递归 Skill 编排，也不会由任何 Skill 推断 commit、push 或 publication 权限。

响应语言与产物语言相互独立。面向人的响应标题、标签、解释和结论依次遵循明确指定的响应语言、项目中针对响应的指令和会话语言；已授权写入的产物正文依次遵循明确指定的产物语言、项目中针对产物的指令、目标产物的现有语言，最后才回退到会话语言。RSP 的 canonical artifact headings、WorkRef 值、路径、命令、标识符和机器消费值保持不变；响应标签可以在括号中保留技术 token，但不能直接使用未翻译的 token 作为标签。

3.0 产品面是这九个 Skills。五个 same-case terminal journeys 已验证 Shape progressive depth，同时保留 owner、environment 和 acceptance stop。RSP 内置有边界的 artifact routing、response continuation 与 evidence-based release documentation；长时 managed orchestration 仍由 host 或 external workflow 显式组合，并且必须重新读取当前 RSP artifacts、保留其 ownership，在 mutation、Git、publication、environment 或 human-decision authority 边界停止。已评估的 `rsp-manage` prototype 保留在 research 中，recommendation 为 `revise`，不会作为 RSP capability 安装或发布；其候选收尾分支仅能在显式 lifecycle-closeout authority 下、Core 完成 durable decision 后执行 archive。

完成一个 tracked Change 时，应按证据组合套件：`rsp-shape` 返回可执行 Change，并把一个关键设计问题交给 `rsp-design`；`rsp-design` 把证据、建议、备选方案和已授权的 planned-design 更新返回同一个 WorkRef；Core 把 unexplained failure 路由到 `rsp-diagnose`，把清晰的 test-first 行为路由到 `rsp-tdd`，把已有证据的修改路由到 `rsp-implement`；`rsp-review` 返回只读报告；`rsp-address-review` 处置 finding；当 selected Change 明确拥有已确认的 release identity 或 range，且发布文档尚未完成时，Core 才把工作路由到 `rsp-release-docs`，由它把一份证据账本投影为职责不同的 Changelog、Release Notes 和 Migration Notes，但不推断 publication authority；最后由 `rsp` 在 archive 前把 implemented current facts、lasting rationale、项目自有 context/instructions 与 temporary continuation 路由到各自已有的 semantic owner。每个 discipline 都返回现有 owner。遇到歧义、失败门禁、缺失权限或超出范围的 Git conflict 时，流程停在该 owner；任何 Skill 都不会推断 Git continuation、commit、delivery 权限或自动重试。

文档分层矩阵：

| Surface | 主要受众 | 职责 |
|---|---|---|
| `README.md` | 人类 | 概览、入门、示例 |
| `.rsp/rsp-rules.md` | 未安装 skill 的 agent | 最小 tool-agnostic fallback protocol |
| `skills/rsp/SKILL.md` | agent | 首选操作指南 |
| `skills/rsp-shape/SKILL.md` | agent | 塑造一个可执行 Change 或合理的 shallow Group |
| `skills/rsp-design/SKILL.md` | agent | 解决一个受跟踪的设计问题并返回同一个 WorkRef |
| `skills/rsp-implement/SKILL.md` | agent | 用 fresh verification evidence 实现一个 ready Change |
| `skills/rsp-diagnose/SKILL.md` | agent | 在生产修复前确认原因 |
| `skills/rsp-tdd/SKILL.md` | agent | 以 test-first 方式实现一个清晰行为 |
| `skills/rsp-review/SKILL.md` | agent | Code 与 Document 只读审查 |
| `skills/rsp-address-review/SKILL.md` | agent | 处置 review findings 并返回可恢复 continuation |
| `skills/rsp-release-docs/SKILL.md` | agent | 准备或审计符合项目约定的发布文档 |
| `AGENTS.md` | 人类与 agent | 有作用域的项目指令与 RSP 导航入口 |

通常应由人先读 `README.md`；agent 应遵循 nearest `AGENTS.md`，可用时加载 `rsp` skill，仅在 skill 不可用时读取 `.rsp/rsp-rules.md`。

如果文档中写的是 `rsp <command>`，默认前提是你的环境里已经能直接运行 `rsp`；否则请使用 `npx -y @oevery/rsp <command>`。

安装完整套件的可选示例：

```bash
npx skills add oevery/rsp
```

也可以只安装一个能力：

```bash
npx skills add oevery/rsp --skill rsp
npx skills add oevery/rsp --skill rsp-shape
npx skills add oevery/rsp --skill rsp-design
npx skills add oevery/rsp --skill rsp-implement
npx skills add oevery/rsp --skill rsp-diagnose
npx skills add oevery/rsp --skill rsp-tdd
npx skills add oevery/rsp --skill rsp-review
npx skills add oevery/rsp --skill rsp-address-review
npx skills add oevery/rsp --skill rsp-release-docs
```

`rsp update` 只会刷新项目内的 RSP 文件。如果你在使用发布出来的 RSP Skills，升级后还需要单独刷新：

```bash
npx skills add oevery/rsp
```

## 从 2.x 迁移

版本 3 仅使用 `.rsp/rsp-rules.md` 作为运行时 fallback，并从 RSP 模型中移除了 project rules：

完整的兼容性、恢复与验证说明见 [3.0 migration guide](https://github.com/oevery/rsp/blob/v3.0.0/docs/migrations/3.0.md)。

1. 升级 RSP CLI。
2. 运行 `rsp update`，生成 canonical fallback 并删除旧的 `.rsp/rules/rsp-rules.md` 生成文件。
3. 如果 `.rsp/rules/` 仍然存在，只把残留内容中稳定且有作用域的指令迁入 nearest project-owned `AGENTS.md`，然后删除旧条目。
4. 将深于 `.rsp/changes/<group>/<change>.md` 的 work path 扁平化，并手动解决 `.rsp/changes/<name>.md` 与 `.rsp/changes/<name>/` 的身份冲突。
5. 运行 `rsp doctor`，处理所有剩余迁移问题。

仓库维护者可以把外部 skill 和 workflow 来源作为离线评审输入进行跟踪。该工具有意不进入发布包；具体用法见[源码仓库维护指南](https://github.com/oevery/rsp/blob/main/docs/upstreams.md)。

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

durable review 包含两个独立语义判断：是否更新当前事实或作用域指令，以及是否需要记录长期理由的 Decision Record；两者都由 RSP skill 或人工 reviewer 完成。

`rsp ready` 和 `rsp show` 会暴露 deterministic readiness 与 semantic-review 信号，但不会把确定性通过直接变成 archive 动作。deterministic readiness 来自 checkbox、blocker 和 scenario；durable update 判断和 advisory archive 建议仍由 Core 或人工负责。

`rsp ready --json` 和 `rsp show --json` 会提供 `durableReview.factDecisions`、`rationaleDecisions`、`factCandidateTargets` 和唯一的 `decisionRecordsPath`。这只是路由指导；RSP 不会虚构文件名或自动提升 Change 内容。

## 推荐工作流

新项目：

1. `npx -y @oevery/rsp init`
2. 优先使用 `npx -y @oevery/rsp init --with-project-setup`，或手动执行 `rsp create project-setup`
3. 填写 `.rsp/specs/design.md`
4. 仅在需要新的长期项目文档时使用 `rsp add spec <name>`
5. 将长期理由写入配置的 Decision Record 目录，将稳定的作用域操作指令写入 nearest project-owned `AGENTS.md`
6. 对需要跟踪的 open work，使用 `rsp create <name>` 开始
7. 如果要让某个已有 open change 成为当前工作，使用 `rsp focus <name>`
8. 如果要将某个 change 移出当前焦点集合，使用 `rsp unfocus <name>`
9. 直接编辑 change 文件并完成实现、勾选 tasks
10. 使用 RSP skill 或人工 review 判断是否需要 durable updates
11. Core 建议 archive 后，在最终 Git 交付前运行 `rsp archive <name>`；重新检查完整工作树，并单独取得 Git 权限

已有复杂 `AGENTS.md` 的项目：

1. `npx -y @oevery/rsp init`
2. 保持受管块尽量薄
3. 将长期设计收敛到 `.rsp/specs/design.md`
4. 只有需要额外的 durable current-fact 文档时才使用 `rsp add spec <name>`

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
rsp update                      刷新 fallback protocol、修复 AGENTS 受管块并重建索引
rsp ui [--lang auto|en|zh-CN]   打开只读交互式仪表盘
rsp add spec <name>             创建 .rsp/specs/<name>.md 并重建 specs 索引
rsp create <name> [summary]     创建 .rsp/changes/<name>.md；可加 --lite 使用更短模板
rsp group create <name> [goal] 创建不进入 focus 的 .rsp/changes/<name>/00-brief.md
rsp group close <name>         所有子 Change 归档后关闭并归档 Group Brief
rsp focus <name>                将一个 open change 标记为当前聚焦
rsp unfocus <name>              将一个 open change 移出当前聚焦集合
rsp archive <name>              归档到 .rsp/archives/ 并更新 archive index
rsp archive --dry-run <name>    预览归档就绪状态，不移动 change
rsp ready <name> [--json] [--verbose]
                                   预览归档就绪状态（与 archive --dry-run 相同）
rsp show <name|--focused> [--json] [--verbose]
                                   显示 change 上下文，带就绪信号和上下文路径
rsp status [--focused|--blocked|--stale <days>] [--json] [--verbose]
                                   查看项目状态与派生依赖计划，并支持当前聚焦相关的轻量筛选
rsp check [--focused] [--json] [--verbose]
                                   校验 change 文件，并对 template/scenario 结构做轻量 lint
rsp doctor [--fix] [--json] [--verbose]
                                   检查接入健康和常见问题
```

操作优先使用 `skills/rsp/SKILL.md`；skill 不可用时使用 `.rsp/rsp-rules.md` 作为最小 fallback protocol。

在真实交互式终端中，裸 `rsp` 会打开与 `rsp ui` 相同的只读仪表盘。CI、管道、重定向流和 `TERM=dumb` 继续使用静态命令输出；人类快照使用 `rsp status`，自动化使用 `rsp status --json`。仪表盘不会创建、聚焦或归档工作。

仪表盘快捷键：`Tab` 切换 Changes/Groups，方向键或 `j`/`k` 移动，`/` 筛选，`Enter` 打开全宽详情，`r` 刷新，`?` 显示帮助，`q`、`Ctrl-C` 或顶层 `Esc` 退出。可设置 `RSP_UI_LANG=en|zh-CN` 或传入 `rsp ui --lang`；只有仪表盘自有标签会本地化。现有 CLI help、纯文本输出、JSON、WorkRef、路径、命令、Skills 和 RSP artifacts 仍保持英文。

当没有 focused change 时，`rsp status` 和 `rsp show --focused --json` 会输出 `nextActions`，但不会自动猜测哪个 open change 是当前工作。

人类可读的 `rsp status` 会把执行指引渲染成依赖森林：父节点依赖其子节点，共享前置依赖以引用方式显示而不重复展开，`Next action` 直接指出当前可执行的 Change。

`rsp status --json` 会在 `plan.nodes`、`plan.ready`、`plan.edges`、`plan.blocked` 和 `plan.waves` 中返回同一份依赖图。节点会区分过滤器选中的 Change 与仅用于解释的前置依赖上下文；过滤后的计划会保留解释结果所需的传递前置依赖闭包。由于同一个前置依赖可能被多个 Change 共享，JSON 保持扁平图结构而不嵌套 children。每条边都读作“`change` requires `requires`”。这些内容是派生的导航事实，不是执行授权或持久化 workflow state。

`rsp create --lite` 是用于显式跟踪小 change 的短模板；简单的当前会话任务默认不应创建 RSP change，除非确实需要跟踪。

`rsp doctor --fix` 只执行安全 deterministic 修复。它的 JSON `fixed` 条目表示实际写入的文件系统变化；健康项目会返回 `fixed: []`，human 输出会说明无需安全修复。

## 工具无关

`.rsp/` 是纯文件约定，适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 助手。RSP 3.1 需要 Node.js 22+；从 3.0 升级时须先更新 Node.js 再安装。
