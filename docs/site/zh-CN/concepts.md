# 核心概念

RSP 把未完成工作、持久化事实、长期理由、作用域指令和已完成历史分开。这种分层让仓库上下文可被发现，同时避免每份产物都成为第二套事实源。

## 产物基础结构

```text
.rsp/
├── rsp-rules.md
├── specs/
│   ├── design.md
│   └── decisions/
├── changes/
├── focus.d/
└── archives/
```

- `.rsp/rsp-rules.md` 是生成的、与工具无关的后备协议；Skill 可用时优先使用 `rsp` Skill。
- `.rsp/specs/` 保存当前有效的能力与协作契约、边界和必要约束，不是代码清单或未来计划。使用 `rsp specs` 可直接从可读 Markdown 派生当前树、查看一个精确文档，或执行有界字面搜索。
- `.rsp/specs/decisions/` 是默认的权威 Decision Record 目录，保存长期理由、备选方案、权衡和后果。
- `.rsp/changes/` 保存未完成工作。每个可执行 Change 都是单个 Markdown 文件。
- `.rsp/focus.d/` 保存候选标记，路径负责选择工作；可选的 Focus Capsule 由 Core 维护进行中的恢复摘要和证据指针，不是权限、验收依据或运行日志。写入沿用 [CLI 参考](./reference/cli.md) 的 v1 格式。终态收尾前，先提炼已确认结果到 Change，再按需回流稳定知识；授权归档会清理 Focus。可移植的 Capsule 可以随授权的未归档 Change 提交。
- `.rsp/archives/` 保留已完成 Change 的历史。

稳定且有作用域的工作流与验证指令属于最近的项目自有 `AGENTS.md`，位于 RSP 受管区块之外。

根与局部 `CONTEXT.md` 使用同一模型：统一语言、领域关系和导航。按需创建，根文件引用局部归属而不复制定义。`CONTEXT-MAP.md` 只作为迁移输入，不再构成独立模型；获得迁移授权后，先保留其语义到 CONTEXT 并更新引用，再退役旧文件。`rsp update` 不会执行这种语义迁移或删除项目上下文。README 保持项目介绍与使用入口，不成为另一份完整规范。

普通入口保留旧上下文的发现能力，仅在发现旧 map 或收到迁移请求时加载 Core 的上下文迁移分支。授权迁移前继续使用相关旧内容，不阻塞无关任务；有定义冲突时先解决再继续依赖它的工作。`rsp update` 与 `rsp doctor` 对根目录旧 map 给出提示，即使 CONTEXT 已存在也不视为迁移完成；`doctor --fix` 不合并或退役任何上下文文件。Core 负责归属协调与退役门禁，Doc 在该权限内承担较大范围写作。

## Spec 写作骨架

新领域 Spec 默认包含 Purpose、Boundaries、Contracts、Scenarios 和 Constraints，分别引导服务对象与价值、责任交界、行为与不变量及失败语义、关键场景和必要限制。不增加清晰度的 Scenarios 可以省略，也不强制 Given/When/Then。架构 Spec 可以使用 Structure，协议或设计依据 Spec 可以保留有表达力的领域标题。DesignRef 表在提供规范依据时属于 Spec 体系，而非仅因包含链接就归为导航。

这是默认写作支架，不是强制 schema。普通文本 HTML 提示可以保留或删除，但不算填写完成，也不提供需求或证据；实际决定和限制必须写在可见正文中。测试结果放在 Change，重要取舍理由放在 Decision Record。优先表达替换内部实现后仍成立的契约；Spec 与代码不一致时先判断偏差，不自动把实现当成正确答案。已有 Spec 只随语义变化维护，不为统一标题批量重写，历史 Change 保持不变。

直接 Specs 查询只读且不依赖服务。它会单独标识 Decision Records，返回 checkout 与源路径归属，并且查询结果永远不能取代源文件本身的权威性。全新初始化与创建 Spec 不会生成 Specs 索引。在兼容迁移中，`rsp update` 与 `rsp doctor --fix` 只会在完整预检及直接查询 postcheck 后移除元数据可识别的保留索引；项目自有的保留内容会安全失败并被保留。

## 仓库原生运行

RSP 从仓库 Markdown 与当前 checkout 证据派生工作流状态。CLI、软件包与 Skills 不提供 daemon、数据库、宿主同步 adapter、Web runtime、浏览器观测面或隐藏 runtime 状态。

Agent 与归属能力解释证据，并决定下一步允许的操作。命令与脚本执行确定性操作并返回观察；退出成功、就绪值或建议操作都不是语义批准。Focus 与生命周期修改仍由相应 CLI 拥有，工具完成标签不能替代必需证据与独立验收。

## 一个 Change，一个结果

一个 Change 拥有一个可观察结果，以及共享的验收、验证、审查、归档和回滚边界。它保留规范的 Proposal、Spec、Design、Tasks、Verify 与 Blockers 章节。Verify 下的 `### Required` 保存验收关键证据，`### Optional` 保存额外环境、兼容性、规模或信心覆盖；未分类的旧 Verify 项按 Required 处理。

Proposal 负责意图与范围，Spec 负责本次契约变化与验收并引用现有规范，Design 负责方案与取舍，Tasks 负责可检查的工作，Verify 负责验证方法及真实结果与缺口，Blockers 负责待定决定和依赖。简单变更保持简短，引用而不复制完整基线，只在正确性、安全或迁移需要时固定任务顺序。

让 Change 成为计划与最终结果的收敛快照。Focus 保存进行中的恢复摘要，详细执行记录由报告或宿主持有；收尾提炼结果到 Change，再按需回流稳定知识，不复制过程流水。

Change 名称可以是扁平形式（`<change>`），也可以是一级分组子项（`<group>/<change>`）；递归工作目录无效。

当 RSP 必须推断新的 WorkRef 时，优先保留用户显式提供的有效标识，其次遵循最近的项目或领域明确命名约定。两者都不存在时，默认从稳定的领域或技术词汇推断 ASCII 小写 kebab-case，例如 `user-login`。用户显式提供或项目约定选择的有效 Unicode WorkRef（例如 `听说训练/模拟朗读`）仍然受支持。产物语言、提交语言、回复语言、宿主 locale 与 TUI 语言都不选择或翻译 WorkRef 的语言，后续命名或语言指导也不会重命名已有标识。

下面的精确阻塞项声明依赖：

```md
- requires `<change-work-ref>`: <reason>
```

RSP 不会从自由文本中猜测依赖边。

## Groups（分组）

Change Group 是唯一的复合工作形式。不可执行的 `<group>/brief` 实体存储为 `<group>/00-brief.md>`，拥有至少两个直接子 Change 共享的目标、约束、已声明切片、完成条件、持久化结果与分组阻塞项。

先创建 Group，再创建子 Change。每个子 Change 独立聚焦、验证、审查和归档。所有已声明的子 Change 完成后才能关闭 Group。重开已关闭的 Group 或已归档的 Change 是显式恢复操作，不会改写 Git 或发布历史。

## 生命周期与持久化审查

持久化生命周期有意保持很小：

```text
open（未完成）→ archived（已归档）
```

就绪情况、阻塞项、建议操作、分组健康状态与受管状态都是派生结果，不是存储状态。归档前需要独立完成两个语义判断：

1. 已实现的当前事实或作用域指令是否需要现有或新的持久化归属位置？
2. 长期理由是否值得写入 Decision Record？

归档用于保留历史，不会自动提升事实。Change 中的 `Spec` 增量标记是规划辅助；`rsp archive` 不会把它们复制到 Specs 或 Decision Records。

Decision Record 路由见[配置](./reference/configuration.md)，操作步骤见[日常工作流](./guides/daily-workflow.md)。
