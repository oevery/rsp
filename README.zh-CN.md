# RSP — Reliable Software Practice

[English](./README.md) | 简体中文

**面向人类与 AI Agent 的仓库原生工程工作流。**

RSP 将模糊意图逐步转化为边界明确、经过实现、审查和验证的软件变更，同时让项目知识可以长期维护、让未完成工作可以可靠恢复。十一个可组合 Skills 共同覆盖工程旅程，但不引入隐藏 workflow state，也不取代项目自己的文件、工具和权限边界。

这套工作流建立在轻量的 **Rules、Specs、Plans** artifact foundation 之上。

## RSP 帮助你完成什么

- 将模糊工作塑造成一个可执行 Change，或一组彼此独立的小切片。
- 在实现前，根据仓库证据解决关键设计问题。
- 将原因不明的失败交给 diagnosis，将普通且证据充分的修改交给 implementation，仅将明确要求或具有具体风险的 test-first 工作交给 TDD。
- 按明确范围审查变更、处理已接受的 findings，并重新运行 fresh verification。
- 将稳定事实、作用域指令、长期理由和完成历史分别保存在正确的 owner 中。
- 为显式且已确认的 release operation 准备或校准发布文档；只有重大协调需要持久 owner 时才使用 Release Change。

## 工作流如何组合

```text
意图
  → Shape
  → 按需 Design
  → Diagnose | TDD | Implement
  → Review → Address accepted findings
  → 显式且确认后的 Release Docs
  → Durable Review → Archive
```

RSP 根据 selected Change、仓库证据、验证结果和 blockers 推导下一步动作。每个能力都把结果返回已有的项目或 RSP owner。RSP 不会自行推断修改代码、继续 Git 操作、commit、publish、deploy 或 approve 的权限。

## 快速开始

```bash
npx -y @oevery/rsp@3.1.0-beta.3 init
npx -y @oevery/rsp@3.1.0-beta.3 doctor
```

推荐启动流程：

```bash
npx -y @oevery/rsp@3.1.0-beta.3 init --with-project-setup
# 填写 .rsp/changes/project-setup.md
# 填写 .rsp/specs/design.md
npx -y @oevery/rsp@3.1.0-beta.3 doctor
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
│   ├── 00-index.md           # 自动生成的直接子项导航
│   ├── design.md
│   ├── decisions/            # 默认的权威 Decision Records；不进入 Specs 索引
│   └── <domain>/
│       ├── 00-index.md       # 自动生成的直接子项导航
│       └── <spec>.md
├── changes/
│   ├── <name>.md
│   └── <group>/
│       ├── 00-brief.md
│       └── <change>.md
├── focus.d/
│   └── <name>
└── archives/
    └── YYYY-MM-DD_<change>.md
```

## 概念

- `specs/` 描述长期稳定的项目事实和当前认可的设计。
- Decision Records 描述难以逆转选择的长期理由、备选方案、取舍和后果；默认位于 `.rsp/specs/decisions/`，也可以配置唯一的外部权威路径。
- `changes/` 描述 open work，包括 feature、fix、refactor、docs、ops 和 research。
- 每个 change 始终是单个 Markdown 文件，并包含 proposal、spec、design、tasks、verification 与 blockers 等明确 section。
- Change 保持为“当前计划与最终证据”的收敛快照：选择足以证明结果的最小验证，只保留具有长期价值的新测试，并让临时 probe 和执行流水留在持久产物之外。持久正文描述真实的领域、系统、用户或操作员；只有 AI 或 agent 确实是产品参与者或约束时才提及它们。
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
- `.rsp/specs/**/00-index.md`：为根目录及含内容的 Spec 目录生成直接子项导航。使用 `rsp update` 对齐全部本地索引；`rsp add spec` 只刷新受影响的目录链。
- `.rsp/specs/design.md`：由 `rsp init` 创建，之后由项目维护。
- `.rsp/specs/decisions/`：默认的权威 Decision Record 目录；只有 Host Project 已有外部 ADR 目录时才配置 `decisions.path`。
- `.rsp/rsp-rules.md`：生成的最小 fallback protocol；可用时优先加载 `rsp` skill。
- 将项目级边界放在 `.rsp/specs/design.md`；通过最近的 `00-index.md` 发现归属于最小领域 Spec 的成组、可复用事实。
- 所有 `00-index.md` 都只是生成导航，不能作为可编辑的当前事实或理由 owner。每个索引只列直接子 Spec 与含内容的直接子目录，并排除 Decision Records。
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

RSP 发布十一个默认、宿主无关、按需加载的生命周期 Skills，以及一个需要显式安装的项目级审计 Skill：

| Skill | 职责 |
|---|---|
| `rsp` | 派生下一动作，指导 setup、durable review 与 archive 判断。 |
| `rsp-shape` | 在不实现的前提下塑造一个可执行 Change 或合理的 shallow Group。 |
| `rsp-design` | 解决一个受跟踪的 domain、module/seam 或 reversible-exploration 问题。 |
| `rsp-implement` | 实现一个 selected ready Change，并提供 fresh verification。 |
| `rsp-diagnose` | 修正前确认原因，或如实返回 unresolved diagnosis。 |
| `rsp-tdd` | 让一个清晰行为经过 RED、GREEN 与安全的 REFACTOR。 |
| `rsp-review` | 对固定的 Code、Document 或 mixed comparison 做只读审查。 |
| `rsp-resolve-findings` | 处置固定 findings，修正 accepted 项，验证并请求复审。 |
| `rsp-commit` | 使用与仓库一致的结构化消息创建一个已授权、精确范围的本地提交。 |
| `rsp-release-docs` | 起草、审计、定稿或校准基于证据的发布表面。 |
| `rsp-manage` | 继续一个显式请求或项目启用且符合条件的 ready Change 或 shallow Group。 |
| `rsp-structural-audit`（可选） | 只读审计一个有界仓库或子树，发现有证据支撑的结构风险。 |

每个生命周期 Skill 都把结果返回现有项目或 RSP owner。只读的 Pre-Change Design 与 `rsp-structural-audit` 可以把一个有界结果直接返回用户，而不虚构 artifact owner。套件不引入隐藏 workflow state 或递归 Skill 编排。任何 Skill 都不会推断 commit、push、publication、deployment、approval 或 human-acceptance 权限。

响应语言与产物语言相互独立。面向人的响应标题、标签、解释和结论依次遵循明确指定的响应语言、项目中针对响应的指令和会话语言；已授权写入的产物正文依次遵循明确指定的产物语言、项目中针对产物的指令、目标产物的现有语言，最后才回退到会话语言。RSP 的 canonical artifact headings、WorkRef 值、路径、命令、标识符和机器消费值保持不变；响应标签可以在括号中保留技术 token，但不能直接使用未翻译的 token 作为标签。

按证据组合套件：Shape 确定 owner；Design 返回一个关键问题；Core 在 Diagnose、TDD 与 Implement 之间选择；Review 保持只读；Resolve Findings 修正 accepted findings 并请求复审；Core 在 archive 前执行 durable decision。显式 release operation 在 identity 或 range 已确认时，可以不创建 Release Change 就进入 Release Docs；只有重大决策、协调、恢复、blocker 或 acceptance 需要持久 owner 时才创建。Manage 是可选能力：它接受一个 selected ready Change 或 shallow Group，并要求独立调度、长时 continuation 或恢复需求；小型或紧耦合工作保持直接执行。项目可以保持显式启用，也可以让 Core 自动选择符合条件的 managed work。

### Managed automation policy

在 `.rsp/config.yaml` 中分别配置自动选择与本地收尾：

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 可取 `explicit` 或 `auto`。`auto` 只授权 Core 为符合条件且已经请求完成或继续的工作选择 Manage；它不授予 planning、product mutation、lifecycle、Git 或外部权限。`closeout` 可取：

- `manual`：archive 与 commit 都不会自动执行。
- `lifecycle`：durable review 后可以 archive，但 commit 仍需要独立权限。
- `local`：允许 lifecycle closeout 和有独立依据的 recovery checkpoint；lifecycle closeout 后，符合条件且 clean、已验证的非小型终态边界会调用一次 `rsp-commit`，小型终态仍不提交。

Change 粒度由一个可观察结果及其共享的 acceptance、verification、review、archive 和 rollback 边界决定，不规定 Git commit 数量。每次 `rsp-commit` 调用仍只创建一个本地 commit。

新的 `rsp init` config template 使用上面的 `auto` 加 `lifecycle` policy。如果省略 `manage`，RSP 则为兼容既有显式 Manage 行为解析为 `activation: explicit` 与 `closeout: local`。普通 `rsp status` 和 `rsp status --json` 顶层的 `manage` 对象都会显示解析后的值。nearest scoped restriction 与 host enforcement 可以缩小该配置上限。RSP 有意不提供 `full` preset：push、tag、publication、deployment、approval 与 human acceptance 始终保持显式且属于外部边界。

人类应从本 README 开始；agent 应遵循 nearest `AGENTS.md`，优先加载 `skills/rsp/SKILL.md`，仅在 Skill 不可用时读取 `.rsp/rsp-rules.md`。

如果文档中写的是 `rsp <command>`，默认前提是你的环境里已经能直接运行 `rsp`。进行 opt-in beta 评估时，应固定精确 prerelease 身份，例如 `npx -y @oevery/rsp@3.1.0-beta.3 <command>`；stable 用户仍可使用不带版本的入口获取 npm `latest`。

将当前精确包内置的默认生命周期 Skill 套件安装到当前项目：

```bash
rsp skills install --dry-run
rsp skills install
```

在 dual TTY 中，`rsp skills` 会打开交互式管理器：默认套件保持选中并锁定，可在确认一次原子安装前选择可选的项目级 Skill。脚本、重定向终端和 CI 使用确定性的发现与安装命令：

```bash
rsp skills list
rsp skills list --json
```

该命令会预检十一个默认 package-owned targets，保留无关的 `.agents/skills` 条目（包括可选 Skills），并且只有显式传入 `--force` 才会替换内容不同的已选目录。按精确名称安装可选的项目级审计 Skill：

升级仍包含 `rsp-address-review` 或 `rsp-codebase-audit` 的安装时，其替代项分别是 `rsp-resolve-findings` 和 `rsp-structural-audit`。安装器会在变更前停止，直到 `--force` 显式授权事务性移除这个过时的 package-owned 目录；`--dry-run --force` 可同时预览移除与安装。

```bash
rsp skills install rsp-structural-audit --dry-run
rsp skills install rsp-structural-audit
```

两种形式都从调用 `rsp` 的同一个包安装，因此 beta 评估可以固定精确 npm 身份：

```bash
npx -y @oevery/rsp@3.1.0-beta.3 skills install --dry-run
npx -y @oevery/rsp@3.1.0-beta.3 skills install
```

精确 prerelease 身份可以避免依赖持续移动的 dist-tag。`rsp update` 只刷新由 RSP 管理的项目文件；刷新 package-owned Skill 套件需要单独运行 `rsp skills install`。

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

1. `npx -y @oevery/rsp@3.1.0-beta.3 init`
2. 优先使用 `npx -y @oevery/rsp@3.1.0-beta.3 init --with-project-setup`，或手动执行 `rsp create project-setup`
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

1. `npx -y @oevery/rsp@3.1.0-beta.3 init`
2. 保持受管块尽量薄
3. 将项目级边界与导航放在 `.rsp/specs/design.md`，把成组的长期事实放入最小领域 Spec
4. 只有需要额外的 durable current-fact 文档时才使用 `rsp add spec <name>`

AI 协助接入：

1. `npx -y @oevery/rsp@3.1.0-beta.3 init --agents-mode print --with-project-setup`
2. 保持受管块原样，只在需要时调整周围由人维护的内容
3. 让 AI 审阅并填写 `.rsp/changes/project-setup.md`
4. 让 AI 填写 `.rsp/specs/design.md`
5. 运行 `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   搭建 .rsp/，并确保 AGENTS.md 含有 RSP 入口块
rsp init --with-project-setup   同时创建 .rsp/changes/project-setup.md
rsp update                      刷新受管项目文件，不更新 packaged Skills
rsp ui [--lang auto|en|zh-CN]   打开只读交互式仪表盘
rsp skills                      在 dual TTY 中打开交互式项目 Skill 管理器
rsp skills list [--json]        列出内置 Skills 及其精确项目安装状态
rsp skills install [name] [--dry-run] [--force]
                                  将默认十一个 Skills 或一个精确可选 Skill 安装到 .agents/skills
rsp add spec <name>             创建 .rsp/specs/<name>.md 并重建 specs 索引
rsp create <name> [summary]     创建 .rsp/changes/<name>.md；可加 --lite 使用更短模板
rsp group create <name> [goal] 创建不进入 focus 的 .rsp/changes/<name>/00-brief.md
rsp group close <name>         所有子 Change 归档后关闭并归档 Group Brief
rsp focus <name>                将一个 open change 标记为当前聚焦
rsp unfocus <name>              将一个 open change 移出当前聚焦集合
rsp archive <name>              归档到 .rsp/archives/
rsp archive --dry-run <name>    已弃用的 rsp ready 兼容入口；不会移动 change
rsp ready <name> [--json [--compact]] [--verbose]
                                   canonical 只读归档就绪投影
rsp show <name|--focused> [--json [--compact]] [--verbose]
                                   显示 change 上下文，带就绪信号和上下文路径
rsp history [--limit <n>] [--since <date>] [--until <date>] [--kind <kind>] [--group <group>] [--search <text>] [--json [--compact]]
                                   列出有界的已归档 Change 摘要（默认 20，最大 100）
rsp history <work-ref> [--json [--compact]]
                                   显示一个精确已归档 Change 的有界证据详情
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
                                   查看项目状态与派生依赖计划，并支持当前聚焦相关的轻量筛选
rsp check [--focused] [--json [--compact]] [--verbose]
                                   校验 change 文件，并对 template/scenario 结构做轻量 lint
rsp doctor [--fix] [--json [--compact]] [--verbose]
                                   检查接入健康和常见问题
```

操作优先使用 `skills/rsp/SKILL.md`；skill 不可用时使用 `.rsp/rsp-rules.md` 作为最小 fallback protocol。

在真实交互式终端中，裸 `rsp` 会打开与 `rsp ui` 相同的只读仪表盘。CI、管道、重定向流和 `TERM=dumb` 继续使用静态命令输出；人类快照使用 `rsp status`，自动化使用 `rsp status --json`。仪表盘不会创建、聚焦或归档工作。

仪表盘快捷键：`Tab` 按 Changes/Groups/History 顺序切换，方向键或 `j`/`k` 移动，`/` 筛选当前 scope，`Enter` 打开全宽详情，`r` 刷新当前 scope，`?` 显示帮助，`q`、`Ctrl-C` 或顶层 `Esc` 退出。History 首次进入时才加载默认有界的近期结果，只有选中记录并按 `Enter` 后才按唯一 archive path 加载结构化详情；更早的记录使用 `rsp history` 过滤查询。可设置 `RSP_UI_LANG=en|zh-CN` 或传入 `rsp ui --lang`；只有仪表盘自有标签会本地化。现有 CLI help、纯文本输出、JSON、WorkRef、路径、命令、Skills 和 RSP artifacts 仍保持英文。

当没有 focused change 时，`rsp status` 和 `rsp show --focused --json` 会输出 `nextActions`，但不会自动猜测哪个 open change 是当前工作。

人类可读的 `rsp status` 会把执行指引渲染成依赖森林：父节点依赖其子节点，共享前置依赖以引用方式显示而不重复展开，`Next action` 直接指出当前可执行的 Change。

`rsp status --json` 会在 `plan.nodes`、`plan.ready`、`plan.edges`、`plan.blocked` 和 `plan.waves` 中返回同一份依赖图。节点会区分过滤器选中的 Change 与仅用于解释的前置依赖上下文；过滤后的计划会保留解释结果所需的传递前置依赖闭包。由于同一个前置依赖可能被多个 Change 共享，JSON 保持扁平图结构而不嵌套 children。每条边都读作“`change` requires `requires`”。这些内容是派生的导航事实，不是执行授权或持久化 workflow state。

`rsp history` 直接检查权威 archive 文件；系统不再生成或读取 Archive Index。列表按 archive date 降序、WorkRef、source path 排序，在 1–100 的结果上限前应用 inclusive date、精确 kind、精确 Group 以及 WorkRef/summary 的大小写不敏感字面搜索。详情只返回有界 summary、scenario/checkbox counts 与结构化 Tasks/Verify/Blockers evidence，不返回 raw Markdown；重复 WorkRef、不可读或格式错误的 archive 会 fail closed。`status` archive trend 与 TUI History 使用同一份已验证 inspection。

产生 JSON 的 `status`、`show`、`ready`、`check`、`doctor` 和 `history` 都支持 `--json --compact`：内容与普通 `--json` 解析结果相同，但序列化为一行并以 LF 结尾。`--compact` 必须与 `--json` 同时使用，其他命令会在执行行为前拒绝它。

`rsp create --lite` 是用于显式跟踪小 change 的短模板；简单的当前会话任务默认不应创建 RSP change，除非确实需要跟踪。

`rsp doctor --fix` 只执行安全 deterministic 修复。它的 JSON `fixed` 条目表示实际写入的文件系统变化；健康项目会返回 `fixed: []`，human 输出会说明无需安全修复。

## 工具无关

`.rsp/` 是纯文件约定，适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 助手。RSP 3.1 需要 Node.js 22+；从 3.0 升级时须先更新 Node.js 再安装。
