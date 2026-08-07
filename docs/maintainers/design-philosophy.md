# RSP 设计哲学

## 目的

本文记录 RSP 的长期设计哲学。

它回答：

- RSP 解决什么问题。
- RSP 给人类和 agent 什么心智模型。
- RSP 优先优化什么。
- RSP 明确避免什么。

本文是解释性设计材料。

它不是 agent 的规范源。

项目级稳定指令以最近的项目自有 `AGENTS.md` 为准。

操作流程优先以 `rsp` skill 为准；skill 不可用时才使用 `.rsp/rsp-rules.md` 最小 fallback protocol。

## 产品定位

RSP 是 **Reliable Software Practice**：面向人类与 AI agent 的仓库原生工程工作流。

它采用三层产品模型：

- **Practice**：以可靠、可恢复、证据驱动的软件工程结果作为产品承诺。
- **Workflow**：通过可组合 Skills 覆盖 shaping、design、diagnosis、TDD、implementation、review、release documentation 与 durable review，并以可显式选择或由项目启用的 managed continuation 处理真正独立的长时 slices；所有结果仍返回已有 owner。
- **Protocol**：以 Rules、Specs、Plans 为轻量 artifact foundation，提供确定性的项目内文件约定、检查和路由事实。

`Reliable Software Practice` 回答 RSP 是什么；`Rules, Specs, Plans` 解释 RSP 如何在仓库中落地。工作流层不会把派生阶段或 controller state 持久化成第二套权威。

它提供：

- durable project knowledge 与 rationale ownership。
- open work、focus、verification 和 completed history 的可恢复协调。
- 人类判断与 AI 执行之间有明确权限边界的桥梁。
- 无平台绑定的文件协议与宿主无关的组合式工程能力。

它不是：

- 项目管理系统。
- git history 替代品。
- schema-heavy spec framework。
- 通用 plugin 或 project-management platform。
- 绑定单一 IDE、agent 或 hosting platform 的系统。

## 核心模型

RSP 分离三类信息：

- 最近的项目自有 `AGENTS.md` 与 `specs/`：分别承载稳定 scoped instructions 和 durable facts。
- `changes/`：open work。
- `archives/`：completed history。

`focus.d/` 是唯一 current-focus truth source。

生命周期只有两个状态：

- `open`：change 文件在 `.rsp/changes/`。
- `archived`：change 文件已移动到 `.rsp/archives/`。

不要引入中间状态。

不要从 `changes/` 推断当前工作。

## 第一原则

### 1. 简单性优先于框架能力

RSP 应选择能正确解决问题的最小模型。

避免：

- 复杂 schema。
- 多层 artifact 编排。
- 推测性抽象。
- 只有大型组织才真正受益的流程复杂度。

如果更轻的方案足够，就选择更轻的方案。

### 2. 单文件 change 是硬原则

一个 open change 必须是单个 Markdown 文件。

原因：

- 人类能完整阅读。
- AI 更容易加载完整上下文。
- 中小项目更需要低认知负担。
- 多文件 change bundle 会把 RSP 推向框架复杂度。

RSP 可以借鉴 OpenSpec。

RSP 不复制 OpenSpec 的多文件 change 结构。

### 3. `change` 是 open work 容器

RSP 使用 `change`，不使用 `feature` 作为顶层工作模型。

`change` 覆盖：

- feature。
- bug fix。
- refactor。
- docs。
- ops。
- research。

`kind` 是 change 内部分类字段。

Change Group 是唯一例外且仍保持浅层：只有两个或更多可独立执行的 Change 共享目标或整体完成条件时，才使用逻辑身份 `<group>/brief`、物理文件 `00-brief.md` 作为父级语义所有者。Brief 不执行、不 focus、不复制子项进度；子 Change 仍各自保持单文件契约并独立归档。递归 group、多文件 child bundle 和额外状态不进入核心。

### 4. Durable truth 与 history 分离

`specs/` 只存未来会反复使用的当前事实；配置的唯一 Decision Record 路径只存难以逆转选择的长期理由、备选方案、取舍和后果；最近的项目自有 `AGENTS.md` 只存 agent 必须遵循的稳定 scoped instructions。

适合 durable layer 的内容：

- 稳定行为。
- 重要边界。
- 长期架构事实。
- 长期约束。
- 稳定运行规则。

只有同时满足“难以逆转”“缺少上下文会令人意外”“存在真实取舍”时，才创建或更新 Decision Record。Spec 回答“当前是什么”，Decision Record 回答“为什么这样选择”；两者不互相复制。

不适合 durable layer 的内容：

- 临时排障历史。
- task-by-task 执行笔记。
- archived changes 的重复拷贝。
- 一次性实现上下文。

Archive 很有价值。

Archive history 不等于 durable truth。

### 5. Deterministic checks 与 semantic judgment 分离

CLI 负责 deterministic 工作。

例如：

- 文件结构检查。
- 必需 section 检查。
- template placeholder 检查。
- clarification marker 检查。
- focus/archive 一致性检查。
- generated index 维护。
- 幂等修复。

Skill 或人工 reviewer 负责 semantic judgment。

例如：

- 是否产生 durable knowledge。
- durable fact 应写到哪里。
- 是否存在值得长期保留的 rationale，以及它应写入哪个 Decision Record。
- warning 是否代表真实语义风险。
- archive 是否语义上 ready。

CLI warning 不能替代语义判断。

### 6. 低扩展性是有意设计

RSP 不追求最大可扩展性。

低扩展性带来：

- 更少 agent 决策分支。
- 更低幻觉概率。
- 更低仓库间语义漂移。
- 更稳定的跨项目心智模型。

RSP 的 protocol foundation 保持稳定、确定且低扩展；完整产品是一套可组合工程工作流，而不是通用平台。

### 7. 跨仓库一致性优先

RSP 应优先追求：

- 统一性高于灵活性。
- 约束性高于可塑性。
- 可预测性高于可定制性。

不同仓库的 RSP 结构越一致，agent 泛化质量越稳定。

## 外部工作流取舍

RSP、spec-kit、OpenSpec 都关心 AI 辅助下的规格、计划与实现一致性。

三者心智模型不同。

### 与 spec-kit 的边界

spec-kit 更像阶段化 spec-driven development。

它强调：

- constitution。
- specify。
- plan。
- tasks。
- implementation gates。

RSP 不采用强阶段门。

RSP 更关注：

- durable truth 与 open work 分离。
- 单文件 change。
- 低 ceremony。
- 可被多个 agent 共同读取。

### 与 OpenSpec 的边界

OpenSpec 使用更结构化的 proposal、tasks、spec delta 模型。

它适合更正式的 spec evolution。

RSP 借鉴 delta thinking。

RSP 不采用多文件 change artifact。

RSP 不自动把 change `Spec` delta 合并进 durable specs。

### 当前采纳的折中

RSP 采纳：

- fixed change sections。
- explicit `kind`。
- lightweight `### ADDED` / `### MODIFIED` / `### REMOVED` delta markers。
- 一个按 `kind` 提示的 Change 模板，覆盖有意跟踪的不同规模工作。

RSP 不采纳：

- 多文件 change bundle。
- 自动 semantic merge。
- 每个小任务默认创建 change。

RSP 不把简单当前会话任务自动提升为 RSP change；需要跟踪时使用普通 `rsp create`。

## 目录角色

### `.rsp/rsp-rules.md`

不支持 Agent Skills 时的最小 fallback protocol。

它不是项目指令或设计存储；RSP 不使用 `.rsp/rules/` 作为运行时或 durable authority。

它应短、稳定、tool-agnostic，只保留无 skill 时安全操作 `.rsp/` 所需的核心约束。

旧 `.rsp/rules/rsp-rules.md` 只由 `rsp update` 识别并迁移，普通命令不读取它；任意旧自定义 rules 必须经过人工语义判断后迁入最近的项目自有 `AGENTS.md`。

### `.rsp/specs/`

Durable project facts。

它存长期事实、边界、约束。

它不存任务历史。

### `.rsp/changes/`

Open work。

每个 change 是一个 Markdown 文件。

可选 Change Group 只允许一个 `00-brief.md` 和直接子 Change；`Slices` 声明成员边界与导航顺序，实际 open、archived、blocked 和 ready 状态全部派生。声明顺序本身不创建依赖边；精确依赖只由子 Change `Blockers` 中的 `requires` WorkRef 声明，CLI 负责派生当前依赖计划。

不要创建多文件 change bundle。

### `.rsp/focus.d/`

唯一 current-focus source。

focus marker 指向当前 open work。

### `.rsp/archives/`

Completed history。

Archive 保留最终上下文、结果、决定性证据、缺口和风险，不保留执行流水。

Archive 不等于 durable truth。

## Change 文件结构

每个 change 保持六个固定 section：

- `Proposal`：为什么存在，目标是什么。
- `Spec`：预期行为变化。
- `Design`：实现形态、影响区域、约束。
- `Tasks`：具体实现工作。
- `Verify`：验证和 durable decision 清单。
- `Blockers`：活跃 blocker；可使用 ``- requires `<change-work-ref>`: <reason>`` 声明一个确定性的可执行 Change 依赖，其余 prose 不会被猜测为依赖边。

依赖图不是新的持久化产物。Change 与 archive heading 继续拥有事实，CLI 只集中投影 `ready`、带原因的 `edges`、`blocked` 和 `waves`。这使人类和 AI 获得同一份紧凑视图，同时避免 Brief、YAML 或独立 graph 文件成为第二份状态来源。

`Verify` 是 section，不是 workflow state。

`Tasks` 比 `Plan` 更直接，因此 RSP 使用 `Tasks`。

## Spec 结构

Durable project specs 应优先使用：

- `Purpose`。
- `Stable Facts`。
- `Boundaries`。
- `Constraints`。

Spec 不是自由备注区。

Spec 不是 archive summary。

如果一个 spec 退化成叙事笔记，就降低了 durable layer 的信噪比。

## Durable update 哲学

不是每个 change 都更新 `specs/` 或项目自有 `AGENTS.md` 指令。

只有长期事实才值得提升。

适合提升的条件：

- 改变稳定系统行为。
- 改变项目边界、默认值或约束。
- 缺少该事实会导致未来工作出错。
- 该事实值得后续 session 反复重读。

不应提升：

- 临时排障历史。
- task-by-task notes。
- 一次性实现上下文。
- archive-only detail。

优先目标：

- 现有的最小领域 Spec。
- 项目级边界与导航 owner `.rsp/specs/design.md`。
- nearest project-owned `AGENTS.md` 中有作用域的稳定指令。
- 配置的唯一 Decision Record 路径下的精确文件。

避免创建兜底式 `.rsp/specs/changes.md`。

把 durable fact 写入最小正确目标文件。

不要把同一 fact 无理由复制到多个 durable 文件，也不要用 Decision Record 重复当前事实。

## 原生设计与 artifact continuation

设计问题会直接改变 Change 的可执行性与后续 durable writeback，因此 RSP 内置一个精简的 `rsp-design` discipline，而不是要求每个项目另外安装完整的 design suite。

它只解决一个边界明确的 material question：按需选择 domain modeling、module/seam design 或 reversible exploration，从最小权威证据链得出结论。Pre-Change Design 不要求 WorkRef，严格 report-only 并将结果返回用户；若 outcome、scope、non-goals、acceptance 或 decomposition 仍不明确，则返回 Shape。Tracked Design 将 recommendation、alternatives、unresolved owner decisions 和 artifact routing 返回同一个 WorkRef；只有显式授权时才更新 selected Change 的 `## Design`，并且不得把 planned design 提前写入 Specs、Decision Records、`CONTEXT.md` 或 `AGENTS.md`。

RSP 内置的是写入判断与所有权路由，不是对项目文档的接管：

- planned future design 属于 selected Change 的 `## Design`；
- implemented stable current facts 属于最小正确 Spec 或已采用且明确授权的项目 context/instruction；
- lasting rationale 独立属于唯一 authoritative Decision Record path；
- temporary execution state 只作为 response continuation 返回，除非用户显式授权 exact path。

Continuation 必须包含 WorkRef、authority pointers、current state、changed artifacts、fresh verification、blockers 和 smallest next action。恢复时重新读取这些 owner、检查 drift 并刷新证据；它不是 durable truth、隐藏 receipt 或第二套 lifecycle state。

普通 Git conflict 不需要独立 RSP Skill。Core 只保留 compact fallback：识别当前 Git operation，理解 base/ours/theirs 语义，保护无关工作，仅解决有证据且在 WorkRef authority 内的内容，并重新验证。缺少证据、涉及无关工作或 owner decision 时停止；resolve authority 不自动包含 stage、continue、abort、commit、push 或 delivery authority。

`rsp-manage` 是可选能力，不是无条件 controller。项目可以保留显式激活，也可以允许 Core 为已经请求完成或继续、且通过资格判断的工作自动选择它；小型或紧耦合任务保持直接执行。自动路由只改变 capability selection，不从配置推导 planning、product mutation 或外部 authority。

Managed goal、dispatch、重试、预算和 convergence count 都是 transient process state。Change、Group、Spec、Decision Record 与项目指令继续拥有 durable truth；每次进展后重新从这些 owner 和当前证据派生下一动作。缺少 owner 时返回 Shape，涉及产品、接口、scope 或 authority 决策时停止。

Managed review 必须有界，且 Resolve Findings 不自行循环。Lifecycle closeout 与 Git delivery 仍是独立能力，但项目可以用 `manual`、`lifecycle`、`local` 三个小型 preset 选择本地收尾上限：不自动收尾、仅 archive，或 archive 加有独立依据的 recovery checkpoint，并在 clean、已验证的非小型终态边界上确定性调用一次 Commit。Change 按语义结果与共享验收/回滚边界塑形，不按 commit 数量拆分。省略配置保持 explicit activation 与既有 local closeout 兼容；nearest restriction 和 host boundary 只能缩小上限。

RSP 不建立通用权限系统，也不提供容易误解为宿主完全授权的 `full` 模式。Push、tag、publication、deployment、approval 和 human acceptance 始终保持显式且在项目配置之外。具体资格、预算、命令和停止条件由 `rsp` 与 `rsp-manage` Skills 拥有，不在设计哲学中复制。

## 输出与可观测性

RSP 更适合作为稳定协议，不是平台 API。

`--json` 输出应是：

- 轻量。
- 稳定。
- deterministic。
- 面向 agent、CI 和脚本。

它不应变成：

- plugin API。
- workflow customization layer。
- 平台绑定接口。

当需要提升 agent 成功率，优先增强：

- 错误可解释性。
- 机器可读输出。
- runtime diagnostics。
- deterministic summary。

不要优先增加 workflow customization。

## 表面角色

RSP 有多个表面。

每个表面只承担自己的职责。

- `README.md`：人类概览、入门、示例。
- `.rsp/rsp-rules.md`：skill 不可用时的最小 fallback protocol。
- `skills/`：优先使用的按需操作手册。
- `docs/maintainers/design-philosophy.md`：设计理由。
- `AGENTS.md`：RSP 受管 block 是入口导航层，项目自有 section 可承载稳定 scoped instructions。

这些表面应互相强化。

它们不应互相复制完整内容。

`.rsp/rsp-rules.md` 不是完整规范副本，而是 skill 不可用时仍能安全运行的最小协议，因此必须短、稳定、少歧义。

fallback protocol 应表达跨工具也必须成立的核心约束。

fallback protocol 不应成为完整操作手册或项目规则仓库。

`skills/` 是按需加载的 agent 操作手册，因此可以比 rules 更详尽。

`skills/` 应把规则转化为可执行步骤。

`skills/` 的详细度服务于减少 agent 幻觉和误操作。

fallback protocol 保持为最小兼容层，`skills/` 保持为详细操作层。

体积预算不能优先于准确性。

如果内容影响以下判断，应保留在 skill 中：

- 是否创建 change。
- 是否写 durable spec。
- 是否写 Decision Record。
- 是否判断 archive ready。
- 是否误改 generated/core files。
- 是否把 deterministic CLI warning 当成 semantic decision。

Skill 的具体性只服务于减少操作误判。

适合进入 skill：

- 必须按顺序执行的命令。
- 会改变文件的操作边界。
- durable writeback 判定条件。
- archive readiness 语义。
- 明确的反误用约束。

不适合进入 skill：

- 历史背景。
- 完整 command reference。
- 长示例。
- 重复规则解释。
- 设计理念展开。

RSP skill 要求 agent 将 `## Tasks`、实现和 `## Verify` 回写保持同步。

## 语言分层原则

Human-facing docs may be localized。

Agent-distributed normative surfaces should stay in English。

原因：

- 英文跨模型更稳定。
- 英文减少不同语言环境下的行为偏移。
- 英文更适合公开分发的 agent instruction asset。

因此：

- `README.md` / `README.zh-CN.md` 可以本地化。
- `docs/` 可使用中文记录维护者设计理由。
- fallback protocol 和 `skills/` 应保持英文。

## AGENTS 哲学

RSP 管理的 `AGENTS.md` block 是导航层；block 外的项目自有 section 是 scoped instruction 层。

它帮助 agent 以正确顺序找到正确文件。

RSP 受管 block 不是：

- 长期设计记录。
- 长期规则存储。
- `specs/`、skill 或 fallback protocol 的重复副本。

只有 `&lt;!-- rsp:begin --&gt; ... &lt;!-- rsp:end --&gt;` 受管 block 由工具拥有。

精确 read order 以 generated block 为准：nearest `AGENTS.md`，可选 context map/context，`rsp` skill 或 `.rsp/rsp-rules.md` fallback，focus 与选中的 Change，最后才是相关 Specs。

## RSP 应避免什么

RSP 应避免：

- 多文件 change artifacts。
- schema-heavy workflow systems。
- 自动 semantic merge engine。
- 混合历史与真相的 summary 文件。
- 强迫每个 change 都更新 specs。
- 让 CLI 承担语义工程判断。
- 为平台化引入高自由度扩展。
- 让仓库间结构和语义大幅漂移。

## 未来变更过滤器

应保留的改动：

- 降低认知负担。
- 强化 open work 与 durable truth 分离。
- 提升 agent / human 可读性。
- 保留轻量单文件 change workflow。
- 让 semantic 与 deterministic 边界更清晰。
- 提高机器可读性而不扩大 workflow complexity。
- 提高可观测性而不重定义核心模型。

应拒绝或重新考虑的改动：

- 无明确收益的框架复杂度。
- 多文件 open work。
- 模糊 archives 与 specs 边界。
- 增加无法映射到 deterministic filesystem truth 的 workflow state。
- 鼓励信息倾倒而不是筛选 durable facts。
- 为灵活性牺牲跨仓库一致性。
- 为生态化牺牲无平台绑定和低认知负担。

## 简短版

- RSP 是面向 AI 辅助工程的轻量知识与 change workflow。
- `specs/` 存 durable project facts；最近的项目自有 `AGENTS.md` 存稳定 scoped instructions。
- `rsp` skill 是首选操作指南，`.rsp/rsp-rules.md` 是最小 fallback protocol。
- `changes/` 存 open work。
- `focus.d/` 是唯一 current-focus source。
- `archives/` 存 completed history。
- CLI 负责 deterministic structure、repair、warning。
- Skill 或 reviewer 负责 semantic durable judgment。
- RSP 应保持小、显式、可读、无平台绑定。
- 低扩展性是有意约束。
- RSP 优先做稳定协议，不做通用平台。
