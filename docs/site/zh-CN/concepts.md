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
- `.rsp/specs/` 保存持久化的当前事实与已达成共识的设计。使用 `rsp specs` 可直接从可读 Markdown 派生当前树、查看一个精确文档，或执行有界字面搜索。
- `.rsp/specs/decisions/` 是默认的权威 Decision Record 目录，保存长期理由、备选方案、权衡和后果。
- `.rsp/changes/` 保存未完成工作。每个可执行 Change 都是单个 Markdown 文件。
- `.rsp/focus.d/` 包含通过路径选择当前工作的标记文件。标记可保存一个简短、可选的 Markdown Focus Capsule，用于记录 Manager 已接受的恢复指针；字节上限内的任意 Markdown 都可接受，版本注释仅为推荐，不是必需项，也不会被解析。其中的文本不是权限、生命周期状态或 worker 传输通道。
- `.rsp/archives/` 保留已完成 Change 的历史。

稳定且有作用域的工作流与验证指令属于最近的项目自有 `AGENTS.md`，位于 RSP 受管区块之外。

直接 Specs 查询只读且不依赖服务。它会单独标识 Decision Records，返回 checkout 与源路径归属，并且查询结果永远不能取代源文件本身的权威性。全新初始化与创建 Spec 不会生成 Specs 索引。在兼容迁移中，`rsp update` 与 `rsp doctor --fix` 只会在完整预检及直接查询 postcheck 后移除元数据可识别的保留索引；项目自有的保留内容会安全失败并被保留。

## 仓库原生运行

RSP 从仓库 Markdown 与当前 checkout 证据派生工作流状态。CLI、软件包与 Skills 不提供 daemon、数据库、宿主同步 adapter、Web runtime、浏览器观测面或隐藏 runtime 状态。

## 一个 Change，一个结果

一个 Change 拥有一个可观察结果，以及共享的验收、验证、审查、归档和回滚边界。它保留规范的 Proposal、Spec、Design、Tasks、Verify 与 Blockers 章节。Verify 下的 `### Required` 保存验收关键证据，`### Optional` 保存额外环境、兼容性、规模或信心覆盖；未分类的旧 Verify 项按 Required 处理。

让 Change 成为当前计划和最终决定性证据的收敛快照。临时探针、调试过程和日常命令流水属于工作会话，不属于持久化产物。

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
