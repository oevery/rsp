# RSP 设计哲学

## 目的

本文档用于记录 RSP 当前的设计哲学。

它应当清楚回答以下问题：

- RSP 试图解决什么问题
- RSP 希望用户和 agent 采用什么心智模型
- RSP 应该优先优化什么
- RSP 应该明确避免什么

这个文件是未来设计决策、评审和产品演进的长期参考。

它是解释性设计材料，不是 agent 的规范源，也不应承载比 `rules/` 或 `skills/` 更高优先级的执行规则。

## 产品定位

RSP 是一个面向 AI 辅助软件工作的轻量工作流。

它不试图成为：

- 完整的项目管理系统
- git 历史的替代品
- 重型规格化框架
- schema 驱动的计划平台
- 与某个单一 IDE、agent 或平台强绑定的工作流系统

RSP 试图成为：

- 长期项目知识层
- 轻量级 open work 跟踪层
- 人类工程判断与 AI 执行之间的清晰桥梁
- 无平台绑定、可被不同助手共同消费的文件约定

## 核心设计目标

RSP 的存在，是为了把长期项目知识与开放中的实现工作分离开来，同时让工作流保持足够简单，适用于小型和中型项目。

落到实际结构上，这意味着：

- 长期真相应放在 `rules/` 和 `specs/`
- open work 应放在 `changes/`
- 已完成工作应移动到 `archives/`
- 系统应同时对人类和 agent 保持可读
- 结构应尽量稳定，避免不同仓库长成完全不同的 RSP 变体

## 第一原则

### 1. 简单性优先于框架能力

RSP 应优先选择能够正确解决问题的最小模型。

它应避免：

- 复杂 schema
- 多层 artifact 编排
- 推测性抽象
- 只有大型组织才真正受益的流程复杂度

如果更轻的方案已经足够，RSP 就应选择更轻的方案。

### 2. 单文件 change 是硬原则

RSP 中的一个 open change 必须保持为单个 Markdown 文件。

这不只是实现细节，而是产品原则。

原因：

- 单文件上下文更容易被人类完整阅读
- 单文件上下文更容易被 AI 正确加载
- 对中小项目而言，低认知负担比 artifact 分离更重要
- 多文件 change bundle 会把 RSP 推向它不想成为的框架复杂度

RSP 可以在理念上借鉴 OpenSpec 一类系统，但不应复制它们的多文件 change 结构。

### 3. `change` 是 open work 容器

RSP 应把 open work 建模为 `change`，而不是 `feature`。

原因：

- `change` 是中性的
- 它天然覆盖 feature、bug fix、refactor、docs、ops 和 research
- 它避免系统偏向只关注用户可见功能

`change` 是顶层工作容器。

`kind` 是这个容器内部的分类字段。

### 4. 长期真相与历史必须分离

`specs/` 和 `rules/` 应承载未来的人类或 agent 会反复用到的长期信息。

长期真相的例子包括：

- 稳定行为
- 重要边界
- 长期有效的架构事实
- 长期约束
- 稳定的运行规则

`specs/` 和 `rules/` 不应变成：

- 持续累加的工作日志
- 临时实现笔记的堆放区
- archived changes 的重复拷贝
- 短暂的排障上下文
- 短期任务笔记

Archive 很有价值，因为它保留了实现历史和决策上下文。

但 archive history 不等于 durable truth。

这意味着：

- 历史细节可以保留在 archives 中
- 只有长期事实才应被提升到 `specs/` 或 `rules/`

### 5. deterministic checks 与 semantic judgment 必须分离

这是 RSP 最重要的设计规则之一。

CLI 应负责 deterministic 工作。

例如：

- 结构校验
- 必需 section 检查
- 一致性检查
- focus/archive 一致性检查
- archive 时机的清单式提示
- 精确的文件系统状态检查
- 精确的命令式修复

语义判断应属于 AI skill 或人工 reviewer。

例如：

- 某个 bug fix 是否改变了稳定行为
- 某个事实应该写入 `design.md` 还是其他 spec
- 某次 change 是否真的产生了 durable knowledge

### 6. 低扩展性是有意设计，不是缺陷

RSP 不追求通过高自由度扩展满足所有 workflow。

对 RSP 而言，较低的扩展性常常意味着：

- 更少的 agent 决策分支
- 更低的幻觉概率
- 更低的仓库间语义漂移
- 更稳定的跨项目心智模型

因此，RSP 的核心模型应保持封闭，而不是逐步演化成平台。

### 7. 跨仓库一致性优先于仓库内自由度

如果 RSP 在不同仓库中呈现出高度不一致的结构和语义，agent 的泛化质量会下降。

因此，RSP 应优先追求：

- 统一性高于灵活性
- 约束性高于可塑性
- 可预测性高于可定制性

这意味着 RSP 更适合成为一个稳定协议，而不是一个可自由拼装的 workflow 平台。

## 核心模型

### 生命周期

RSP 应让生命周期保持简单和 deterministic，同时显式表示当前 focus。

在生命周期层面，系统只需要两个状态：

- `open`
- `archived`

`open` 表示 change 仍存在于 `changes/` 中。

`archived` 表示 change 已被移动到 `archives/` 中，成为完成历史。

除非某个状态能映射到清晰的文件系统真相，否则 RSP 不应引入额外生命周期状态。

也就是说，它应避免建模这些模糊中间状态：

- AI started working
- in review
- verified
- 任何无法从文件系统真相推导出的 workflow label

### 当前 focus

`focus.d/` 是唯一的 current-focus 层。

它用于标识哪些 open changes 当前处于前景。

Agent 不应仅从 `changes/` 推断当前 focus。

如果某个 change 不在 `focus.d/` 中，除非用户明确要求或重新 focus，否则不应默认视为当前工作。

### 工作模型

预期的 work-state 模型是：

```text
open -> archived
```

在 `open` 内部，可能包含这些活动：

- 创建 change
- focus 或 unfocus change
- 编辑实现
- 更新 tasks 和 verify 备注
- 判断是否需要 durable updates

这些活动有用，但它们不是独立系统状态。

对于已存在的工作，创建与 focus 必须保持为不同动作。重复使用一个已有 change，不应静默重定义当前 focus 集合。

`rsp archive <name>` 会把 change 文件移动到 `archives/`。Archive 永不阻塞；它只发出 warning，把语义决策留给 agent 或人类。

Archive 应优先依赖 deterministic checklist signal，而不是模板文本猜测。

## 目录角色

RSP 使用一组数量很小、职责明确的目录：

```text
.rsp/
├── rules/
├── specs/
├── changes/
├── focus.d/
├── archives/
└── config.yaml
```

### `rules/`

用于存放长期有效的操作规则。

`rules/` 是 RSP 约定的 canonical behavioral source。

其他表面可以概括或操作化这些规则，但不应重新定义它们。

### `specs/`

用于存放项目级 durable facts、边界和约束。

### `changes/`

用于存放 open work。

每个 change 都是单个文件。

### `focus.d/`

用于存放表示当前 focused open changes 的空标记文件。

路径本身就是真相源。

`focus.d/` 是唯一的 focus truth source。

没有 marker 的 open change 是 unfocused，默认不应被视为当前工作。

### `archives/`

用于存放已完成的 changes 作为历史。

## Change 结构

### Change 模板哲学

本节解释为什么 RSP 选择这套结构；精确的 section 名称和执行规则以 `rules/rsp-rules.md` 为准。

RSP 之所以围绕下面这些 section 组织 change，是因为这样最容易兼顾人类可读性、AI 可读性和长期一致性：

- `Proposal`
- `Spec`
- `Design`
- `Tasks`
- `Verify`
- `Blockers`

这个结构是刻意设计的。

这里倾向于要求像 `kind` 这样的分类字段显式选择，而不是静默默认。

当 `kind` 未被明确选择时，模板显式失败更符合这套设计，因为正确分类比占位便利更重要。

从设计上看，核心 section 集合保持跨项目固定，会比项目内自由变化更稳。

如果某个 section 对当前 change 不需要，保留该 section 并明确写出 `- none` 或 `- not needed: <reason>`，通常比直接删掉它更利于一致性。

### `Proposal`

用于说明这个 change 为什么存在，以及它试图完成什么。

### `Spec`

用于描述预期行为变化。

它应当是 change-oriented 的，而不是泛泛的备注区。

### `Design`

用于描述实现形态、受影响区域和技术约束。

### `Tasks`

用于描述具体的实现工作。

在单文件模型中，`Tasks` 比 `Plan` 更不歧义，因此应优先使用 `Tasks`。

### `Verify`

用于记录 archive 时的验证清单。

这包括：

- automated checks
- manual checks
- durable update decision

`Verify` 是 change 文件中的一个 section，而不是独立 workflow state。

### `Blockers`

用于显式记录活跃 blocker。

## Spec 结构

### Spec 模板哲学

通用 project specs 更适合承载 durable truth。

从设计上看，它们优先使用这些 section 会更利于长期维护：

- `Purpose`
- `Stable Facts`
- `Boundaries`
- `Constraints`

它们如果退化成模糊的叙事型笔记，就会偏离 RSP 期望的高信噪比 durable layer。

这也是为什么 RSP 不把 `spec` 当成自由描述区。

## Durable update 哲学

本节解释 durable update 的设计动机；精确规则以 `rules/rsp-rules.md` 为准，`skills/rsp/SKILL.md` 只负责配套的操作流程与输出格式。

不是每个 change 都值得更新 `specs/` 或 `rules/`。

只有真正产生了长期知识的 change，才值得被提升。

当满足以下任一条件时，把一个事实提升到 durable layer 才更有意义：

- 它改变了稳定系统行为
- 它改变了项目边界或默认值
- 如果缺少这个事实，未来工作很可能出错
- 它值得在后续 session 中被反复重读

以下内容如果被提升，通常会污染 durable layer：

- 临时排障历史
- task-by-task 执行笔记
- 一次性实现上下文
- 仅属于 archive 的历史细节

用兜底式 `.rsp/specs/changes.md` 来代替判断，会违背这套设计的筛选目标。

在这个模型下，优先选择下面这些落点通常更稳：

- `specs/design.md`
- 现有领域 spec
- 更具体的 rules 文件

而不是写入一个总结倾倒文件。

### 最小正确目标文件

当 durable fact 需要被写入时，把它放到最小正确目标文件，更符合 RSP 的设计目标。

这意味着：

- 项目级设计、边界、默认值和跨模块约束，优先写入 `specs/design.md`
- 稳定本地工作流或验证规则，优先写入 `rules/project-rules.md`
- 更具体的长期规则，写入对应的 `rules/<name>.md`
- 可复用的项目级事实，写入对应的 `specs/<name>.md`

如果没有明确长期理由，同一个 durable fact 散落到多个 durable 文件中通常会增加漂移风险。

## 扩展性哲学

### 核心封闭，边缘谨慎开放

RSP 的设计原则不是“尽量提供更多扩展点”，而是“保护核心模型不被扩展性侵蚀”。

因此，RSP 应坚持：

- core closed
- edge configurable

这不是为了压制使用场景，而是为了保护一致性、降低幻觉风险、降低错误率。

### 不应开放的部分

以下内容不应被开放为项目可配置或可扩展表面：

- change 核心 section 结构
- 生命周期状态集合
- 多文件 change artifact
- 自动 semantic merge
- 通用插件平台
- 会重定义核心心智模型的 workflow profile

### 可以谨慎增强的方向

如果未来需要继续增强，优先考虑这些低歧义、低破坏性的方向：

- machine-readable 输出
- 只读型状态视图
- 可观测性增强
- 少量阈值类或展示类能力

这些增强的目标应是降低错误率和维护成本，而不是扩大 workflow 自由度。

## 输出与可观测性哲学

### 稳定协议优先于平台化接口

RSP 更适合作为稳定协议，而不是平台 API。

因此，像 `--json` 这样的机器可读输出，应被设计为：

- 轻量
- 稳定
- deterministic
- 面向 agent、CI 和脚本消费

而不是：

- 插件 API
- workflow 自定义入口
- 平台绑定接口层

### 可观测性优先于工作流定制

当需要提升 agent 成功率时，RSP 更应优先增强：

- 错误可解释性
- 机器可读输出
- runtime diagnostics
- deterministic summary

而不是优先增加更多 workflow customization。

对 RSP 而言，让 agent 更少猜测，通常比让用户拥有更多可塑性更重要。

## 表面角色

RSP 使用多个面向人类和 agent 的表面，每个表面有不同职责：

- `README.md`：面向人的概览、入门和示例
- `rules/`：规范性的行为真相源
- `skills/`：如何应用这些规则的操作指导
- `AGENTS.md`：入口式导航层

这些表面应彼此强化，但不应在每个地方重复完整规范内容。

### 语言分层原则

面向人类的文档可以本地化。

例如：

- `README.md` / `README.zh-CN.md`
- 设计准则和面向维护者的内部文档

但面向 agent 分发的规范性表面应保持英文。

例如：

- `rules/`
- `skills/`
- 其他会被不同模型、不同工具、不同用户直接复用的指令资产

原因：

- 英文是跨模型、跨工具分发时更稳定的工作语言
- 可以减少不同语言环境下的行为偏移
- 更适合作为公开分发与复用的 agent 指令资产

因此，RSP 的语言策略应是：human-facing docs may be localized; agent-distributed normative surfaces should stay in English.

### Skill 哲学

RSP skill 的存在，是因为有些决策天然具有语义性。

`rules/` 是规范源。

Skill 应以最少猜测来操作化这些规则，而不是成为第二套规范源。

Skill 应帮助判断：

- 是否产生了 durable knowledge
- 这些知识应写到哪里
- 应该写下哪些精确事实
- archive 前的 warning 是否代表真实语义风险

Skill 不应替代 deterministic CLI checks。

CLI 与 skill 应是互补关系，而不是重叠关系。

当 skill 给出指导时，它应优先使用：

- 精确文件路径
- 精确命令
- 精确 durable facts

而不是增加幻觉风险的模糊摘要。

### AGENTS 哲学

本节解释为什么 `AGENTS.md` 被限制为导航层；精确的 managed block 内容与读取顺序以工具生成结果和 `rules/rsp-rules.md` 为准。

`AGENTS.md` 作为导航层，会比把它做成另一份规则/设计存储更符合这套设计。

它的作用更适合被理解为：帮助 agent 以正确顺序发现正确文件。

在已正确初始化的 RSP 项目中，`AGENTS.md` 默认存在并包含受管的 RSP block，会让入口行为更稳定。

如果 `AGENTS.md` 变成下面这些东西，就会偏离它的设计定位：

- 长期设计记录
- 长期规则存储
- `specs/` 或 `rules/` 的重复副本

只有受管 RSP block 应由工具拥有所有权。

## RSP 应避免什么

RSP 应明确避免向这些方向漂移：

- 多文件 change artifacts
- schema-heavy workflow systems
- 自动 semantic merge engine
- 混合历史与真相的兜底 summary 文件
- 强迫每个 change 都更新 specs
- 让 CLI 命令承担语义工程判断
- 为了“更像平台”而引入高自由度扩展
- 让不同仓库的 RSP 结构和语义发生大幅漂移

## 未来变更的决策过滤器

当演化 RSP 时，使用这个过滤器：

### 如果一个改动满足以下任一条件，应保留

- 降低认知负担
- 强化 open work 与 durable truth 的分离
- 提升 agent / human 可读性
- 保留轻量单文件 change workflow
- 让 semantic 与 deterministic 的职责边界更清晰
- 提高机器可读性而不扩大工作流复杂度
- 提高可观测性而不重定义核心模型

### 如果一个改动满足以下任一条件，应拒绝或重新考虑

- 在没有明确收益时引入框架式复杂度
- 推动 RSP 走向多文件 open work
- 模糊 archives 与 specs 的边界
- 增加无法映射到 deterministic 文件系统真相的 workflow state
- 鼓励信息倾倒，而不是筛选 durable facts
- 为了灵活性牺牲跨仓库一致性
- 为了生态化牺牲无平台绑定和低认知负担

## 简短版

如果要用几句话总结 RSP，可以是这样：

- RSP 是一个面向 AI 辅助工程的轻量知识与 change 工作流。
- `rules/` 和 `specs/` 存放 durable truth，其中 `rules/` 是 canonical behavioral source。
- `changes/` 存放 open work，`focus.d/` 是该工作唯一的 current-focus 层。
- `archives/` 存放历史。
- CLI 负责结构、一致性和 archive 时的 deterministic warning。
- Skill 或 reviewer 负责 durable knowledge 的语义判断。
- 系统应保持小、显式、可读、无平台绑定。
- 低扩展性是有意约束；RSP 优先做稳定协议，而不是通用平台。
