# RSP 设计哲学

## 目的

本文记录 RSP 的长期设计哲学，帮助维护者判断产品与工作流变更：

- RSP 解决什么问题。
- RSP 给人类和 agent 什么心智模型。
- RSP 优先优化什么。
- RSP 明确避免什么。

本文是解释性设计材料，不是 agent 的规范源。项目级稳定指令以最近的项目自有 `AGENTS.md` 为准；操作流程优先以 `rsp` skill 为准，skill 不可用时才使用 `.rsp/rsp-rules.md` 最小 fallback protocol。

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

`focus.d/` 是 open work 的 FocusSet truth source；其中每个 marker 指向一个当前 open work 候选，AI 可以从集合中选择默认操作对象。

生命周期只有两个状态：

- `open`：change 文件在 `.rsp/changes/`。
- `archived`：change 文件已移动到 `.rsp/archives/`。

不引入中间状态，也不从 `changes/` 文件的存在推断当前工作。

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

RSP 可以借鉴 OpenSpec，但不复制它的多文件 change 结构。

### 3. `change` 是 open work 容器

RSP 使用 `change` 而非 `feature` 作为顶层工作模型，因为 `change` 覆盖：

- feature。
- bug fix。
- refactor。
- docs。
- ops。
- research。

`kind` 是 change 内部分类字段。

Change Group 是唯一例外且仍保持浅层：只有两个或更多可独立执行的 Change 共享目标或整体完成条件时，才使用逻辑身份 `<group>/brief`、物理文件 `00-brief.md` 作为父级语义所有者。Brief 不执行、不 focus、不复制子项进度；子 Change 仍各自保持单文件契约并独立归档。递归 group、多文件 child bundle 和额外状态不进入核心。

### 4. Durable truth 与 history 分离

`specs/` 保存未来会反复使用的当前契约、边界与必要约束；配置的唯一 Decision Record 路径保存重要选择的长期理由、备选方案、取舍和后果；项目自有 `CONTEXT.md` 保存统一语言、领域关系和导航，`AGENTS.md` 保存稳定的 scoped instructions。

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

Archive 用于保留有价值的历史，不构成 durable truth。

### 5. Deterministic checks 与 semantic judgment 分离

CLI 与脚本负责 deterministic 操作、检查和观察，例如：

- 文件结构检查。
- 必需 section 检查。
- template placeholder 检查。
- clarification marker 检查。
- focus/archive 一致性检查。
- 可识别生成索引的兼容迁移与直接 Specs 查询。
- 幂等修复。

Agent、归属 Skill 或人工 reviewer 负责 semantic judgment，例如：

- 是否产生 durable knowledge。
- durable fact 应写到哪里。
- 是否存在值得长期保留的 rationale，以及它应写入哪个 Decision Record。
- warning 是否代表真实语义风险。
- archive 是否语义上 ready。

CLI warning、退出成功、readiness 或脚本完成都不能提供语义批准。归属能力在目标、范围、权限、权威基线与必需证据不变时选择允许的方法；工具的存在、版本或返回标签不替它作决定。明确命名的强制检查、溯源操作与必需独立 worker 不因方法切换而消失，focus 和 archive 等命令拥有的 RSP 修改仍使用相应 CLI。

纯工具障碍先诊断原因、检查实际副作用，再继续只读或已证明可安全重复的工作。必需证据缺失、未知修改、一次性操作的未知重放安全性或权限变化仍须停止。日常验证与恢复的操作路径见[日常工作流](../site/zh-CN/guides/daily-workflow.md#验证与审查)。

以本地交付为例，`rsp-commit` 的责任不可替代，但执行可选择配套 CLI 或经过等价检查的原生 Git。工具缺失、旧版本能力不足或已确认发生在执行前的工具故障，应在相同授权和已评审边界内处理；真实安全拒绝、已尝试提交或未知副作用必须停止。不能仅凭退出码或 `not_attempted` 字段切换，也不能据此手动替代 RSP 管理产物的命令操作。规范边界由仓库内 `.rsp/specs/design.md` 维护。

### 6. 低扩展性是有意设计

RSP 有意限制扩展性，以获得：

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

RSP、spec-kit、OpenSpec 都关心 AI 辅助下的规格、计划与实现一致性，但心智模型不同。

### 与 spec-kit 的边界

spec-kit 更像阶段化 spec-driven development。

它强调：

- constitution。
- specify。
- plan。
- tasks。
- implementation gates。

RSP 不采用强阶段门，更关注：

- durable truth 与 open work 分离。
- 单文件 change。
- 低 ceremony。
- 可被多个 agent 共同读取。

### 与 OpenSpec 的边界

OpenSpec 使用更结构化的 proposal、tasks、spec delta 模型，适合更正式的 spec evolution。RSP 借鉴 delta thinking，但不采用多文件 change artifact，也不自动把 change `Spec` delta 合并进 durable specs。

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

不支持 Agent Skills 时的最小 fallback protocol。它应短、稳定、tool-agnostic，只保留无 skill 时安全操作 `.rsp/` 所需的核心约束，不承担项目指令或设计存储；RSP 不使用 `.rsp/rules/` 作为运行时或 durable authority。

旧 `.rsp/rules/rsp-rules.md` 只由 `rsp update` 识别并迁移，普通命令不读取它；任意旧自定义 rules 必须经过人工语义判断后迁入最近的项目自有 `AGENTS.md`。

### `.rsp/specs/`

Durable project facts：保存长期事实、边界与约束，不存任务历史。

### `.rsp/changes/`

Open work：每个 change 是一个 Markdown 文件。

可选 Change Group 只允许一个 `00-brief.md` 和直接子 Change；`Slices` 声明成员边界与导航顺序，实际 open、archived、blocked 和 ready 状态全部派生。声明顺序本身不创建依赖边；精确依赖只由子 Change `Blockers` 中的 `requires` WorkRef 声明，CLI 负责派生当前依赖计划。

不要创建多文件 change bundle。

### `.rsp/focus.d/`

Open work 的 FocusSet source。每个 focus marker 指向一个当前 open work 候选，多个 marker 可以同时存在。

Core 按需在 marker 中维护进行中的工作快照和证据指针；收尾先提炼结果到 Change，再将稳定知识按归属写回文档。Focus 文本不提供权限或验收，授权归档后由 CLI 清理。

### `.rsp/archives/`

Completed history：保留最终上下文、结果、决定性证据、缺口和风险，不保留执行流水，也不成为 durable truth。

## Change 文件结构

每个 change 保持六个固定 section：

- `Proposal`：为什么存在，目标是什么。
- `Spec`：本次契约变化与验收条件，引用而不复制现有规范。
- `Design`：实现方案、责任边界与必要取舍，不重复需求和任务。
- `Tasks`：可检查的工作，仅在正确性、安全或迁移需要时固定顺序。
- `Verify`：验收对应的验证方法、真实结果、缺口和限制，不重复需求或命令流水。
- `Blockers`：活跃 blocker；可使用 ``- requires `<change-work-ref>`: <reason>`` 声明一个确定性的可执行 Change 依赖，其余 prose 不会被猜测为依赖边。

依赖图不是新的持久化产物。Change 与 archive heading 继续拥有事实，CLI 只集中投影 `ready`、带原因的 `edges`、`blocked` 和 `waves`。这使人类和 AI 获得同一份紧凑视图，同时避免 Brief、YAML 或独立 graph 文件成为第二份状态来源。

`Verify` 是 section，不是 workflow state；`Tasks` 比 `Plan` 更直接，因此 RSP 使用 `Tasks`。

## Spec 结构

新领域 Spec 的默认写作支架为：

- `Purpose`：能力、服务对象与价值。
- `Boundaries`：职责、非职责及责任交界。
- `Contracts`：当前有效的行为、输入输出、不变量与失败语义。
- `Scenarios`：少量关键协作、失败或易混淆场景，按需保留。
- `Constraints`：必要技术、协议、安全或兼容性限制。

支架不是强制 schema；架构、协议与设计依据文档可以使用有表达力的领域标题，不强制 Given/When/Then。普通文本 HTML 提示可以保留或删除；实际要求与限制必须在可见正文中，占位符仍需填写。不为标题一致批量重写既有 Spec 或历史 Change。

根和局部 `CONTEXT.md` 统一承担术语、领域关系和导航；`CONTEXT-MAP.md` 只作为显式迁移输入，合并语义并修复引用后才退役。AGENTS 承担操作规则，README 承担介绍与使用入口。按内容责任而非表格或索引形式判断归属，DesignRef 可以承载规范依据。

上下文迁移是 Core 的按需分支：常规入口只负责发现旧文件并保留相关上下文，迁移细节在命中时加载。发现不授予修改权限，也不阻塞无关工作。CLI 仅提示根目录旧文件；Core 在授权范围内协调语义归属、引用和退役，Doc 负责具体写作。文件共存和命令成功都不能证明迁移完成。

Spec 不是自由备注区或 archive summary。把 Spec 写成叙事笔记会降低 durable layer 的信噪比。

## Durable update 哲学

不是每个 change 都更新 `specs/` 或项目自有 `AGENTS.md` 指令。适合提升的长期事实包括：

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
- 项目级架构契约 owner `.rsp/specs/design.md`。
- nearest project-owned `CONTEXT.md` 中的统一语言、领域关系和导航。
- nearest project-owned `AGENTS.md` 中有作用域的稳定指令。
- 配置的唯一 Decision Record 路径下的精确文件。

把 durable fact 写入最小正确目标文件，避免创建兜底式 `.rsp/specs/changes.md`。不要把同一 fact 无理由复制到多个 durable 文件，也不要用 Decision Record 重复当前事实。

## 原生设计与 artifact continuation

设计问题可能影响 Change 的可执行性与后续 durable writeback，因此由 `rsp-shape` 按需处理有界设计问题，而不是要求项目另外安装完整的 design suite。纯设计请求保持只读，无需制造 Change；只有明确获得规划写入权限时才写回既有归属。

它只解决一个边界明确的 material question：按需选择 domain modeling、module/seam design 或 reversible exploration，从最小权威证据链得出结论。Pre-Change Design 不要求 WorkRef，严格 report-only 并将结果返回用户；若 outcome、scope、non-goals、acceptance 或 decomposition 仍不明确，在 Shape 内按需转入澄清／塑形方法，规划产物写入仍需独立授权，不制造外部交接。Tracked Design 将 recommendation、alternatives、unresolved owner decisions 和 artifact routing 交还同一个 WorkRef；只有显式授权时才更新 selected Change 的 `## Design`，不得把 planned design 提前写入 Specs、Decision Records、`CONTEXT.md` 或 `AGENTS.md`。

RSP 内置的是写入判断与所有权路由，不是对项目文档的接管：

- planned future design 属于 selected Change 的 `## Design`；
- implemented stable current facts 属于最小正确 Spec 或已采用且明确授权的项目 context/instruction；
- lasting rationale 独立属于唯一 authoritative Decision Record path；
- temporary execution state 只作为 response continuation 返回，除非用户显式授权 exact path。

需要 continuation 时，按需说明 WorkOwner、authority pointers、current state、changed artifacts、fresh verification、blockers 和 smallest next action。Change 使用 WorkRef，Group 使用 Group reference 及直接子项；有界直接请求以该请求标识归属，不制造 WorkRef。恢复时重新读取归属与证据、检查 drift 并刷新判断；continuation 不是 durable truth、隐藏 receipt 或第二套 lifecycle state。

普通 Git conflict 不需要独立 RSP Skill。Core 只保留 compact fallback：识别当前 Git operation，理解 base/ours/theirs 语义，保护无关工作，仅解决有证据且在 WorkRef authority 内的内容，并重新验证。缺少证据、涉及无关工作或 owner decision 时停止；resolve authority 不自动包含 stage、continue、abort、commit、push 或 delivery authority。

Core 内部的按需协调分支不是另一个 controller。项目保留 `manage.activation` 的显式或自动选择语义，仅在真实耦合切片、恢复、独立验收、共享资源或收尾协调义务存在时选择；普通工作即使跨多个方法也在同一权限范围内连续完成，方法边界并不等于 worker 边界。自动选择不从配置推导 planning、product mutation 或外部 authority。

协调中的 dispatch、重试、预算和 convergence count 都是 transient process state。Change、Group、Spec、Decision Record 与项目指令继续拥有 durable truth；受影响的事实和证据在恢复或边界变化时重读。同范围方法切换与可修复失败留在当前能力内；纯只读设计／诊断不制造 owner，实质产品、接口、scope 或 authority 决策则停止。

按需协调下的 review 必须有界；固定发现由 Implement 逐条处置与有界修正，另由只读 Review 复审，不自行宣称 review-clean。Lifecycle closeout 与 Git delivery 仍是独立能力；`manual`、`lifecycle`、`local` 的既有本地收尾上限只适用于真实合格且已选择的协调分支，通过最新门禁且不受更近禁止时才考虑。普通连续工作不因配置自动 archive/commit。Change 按语义结果与共享验收/回滚边界塑形，不按 commit 数量拆分；省略配置仍保持 explicit activation 与 local closeout 的兼容默认值。

RSP 不建立通用权限系统，也不提供容易误解为宿主完全授权的 `full` 模式。Push、tag、publication、deployment、approval 和 human acceptance 始终保持显式且在项目配置之外。具体资格、预算、命令和停止条件由 `rsp` 的按需分支及相关独立能力拥有，不在设计哲学中复制。

## 输出与可观测性

RSP 更适合作为稳定协议，而非平台 API；`--json` 输出应是：

- 轻量。
- 稳定。
- deterministic。
- 面向明确的机器消费者，而不是默认的人类或 AI 阅读表面。

RSP 的输出表面按职责分层：

- TUI 面向交互式人类操作；
- plain 面向人类和 AI 的默认语义读取；
- JSON 面向需要精确字段的 Agent、CI 和脚本。

默认 JSON 应只投影当前工作事实、依赖门禁、执行波次、摘要和结构化诊断。人类提示、历史趋势和 runtime 诊断属于 plain/TUI 或 JSON verbose 表面，不应无条件进入默认机器投影。

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

各表面按读者与任务分工：

- `README.md`：人类概览、入门、示例。
- `.rsp/rsp-rules.md`：skill 不可用时的最小 fallback protocol。
- `skills/`：优先使用的按需操作手册。
- `docs/maintainers/design-philosophy.md`：设计理由。
- `AGENTS.md`：RSP 受管 block 是入口导航层，项目自有 section 可承载稳定 scoped instructions。

这些表面通过任务导航互相强化，不复制完整内容。`.rsp/rsp-rules.md` 是 skill 不可用时仍能安全运行的最小兼容协议，表达跨工具的核心约束，保持短、稳定、少歧义，不成为完整操作手册或项目规则仓库。

`skills/` 是按需加载的 agent 操作手册，把规则转化为可执行步骤。它可以比 rules 更详尽，但详细度必须服务于减少误判和误操作；体积预算不能优先于准确性。

如果内容影响以下判断，应保留在 skill 中：

- 是否创建 change。
- 是否写 durable spec。
- 是否写 Decision Record。
- 是否判断 archive ready。
- 是否误改 generated/core files。
- 是否把 deterministic CLI warning 当成 semantic decision。

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

精简时优先保留任务特有的判断、边界和完成证据，减少通用教学与不必要的固定路线，让 Agent 在权限和证据边界内选择方法。模型升级不是删除安全约束的理由，文本变短也不等于质量提高。规范由 [Skill Spec](../../.rsp/specs/skill.md#instruction-and-resource-design) 和[写作质量 Spec](../../.rsp/specs/writing-quality.md)维护。

References 服务于实际的条件分支，不追求入口最短或文件最多。只把当前任务不需要的实质细节放到条件引用中；小 Skill 可以直接写完，必要安全条件不藏在引用链末端。已有上游依据见[维护者来源说明](upstreams.md#reuse-completed-source-evidence)，无需为同一结论重新采集资料。

RSP skill 要求 agent 将 `## Tasks`、实现和 `## Verify` 回写保持同步。

## 语言分层原则

Human-facing docs 可本地化，agent-distributed normative surfaces 保持英文，原因是：

- 英文跨模型更稳定。
- 英文减少不同语言环境下的行为偏移。
- 英文更适合公开分发的 agent instruction asset。

因此：

- `README.md` / `README.zh-CN.md` 可以本地化。
- `docs/` 可使用中文记录维护者设计理由。
- fallback protocol 和 `skills/` 应保持英文。

## AGENTS 哲学

RSP 管理的 `AGENTS.md` block 是导航层，帮助 agent 按正确顺序找到文件；block 外的项目自有 section 是 scoped instruction 层。

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
