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

## 可选 runtime

RSP 可以显式启动一个兼容的用户级 Broker，供 runtime 能力使用。Broker 是本地 loopback 传输层和惰性 checkout session 宿主，不是另一套工作流引擎或事实源。每个规范化仓库或 worktree 都有独立的 project identity、内存 access token 与可丢弃 namespace；session 空闲卸载不会修改仓库文件。

普通 CLI 工作仍不依赖服务。`rsp status`、`rsp check`、`rsp show`、`rsp ready`、`rsp specs`、生命周期、Git 与修复命令不会启动 Broker，也不会创建其缓存。Protocol 或 runtime-schema 不兼容时会安全失败，而不是自动创建 side-by-side 服务。

Doctor 可以只读检查已有 discovery、runtime 与有界 context 状态。Stale context 只是可丢弃信息；incompatible 或 corrupt runtime 状态会携带有界恢复指导。仓库迁移不会静默处置缓存；显式处置必须先关闭精确 owner，并且只作用于一个已解析 checkout namespace。

当 runtime 操作需要保留观察记录时，对应 Broker session 会惰性打开一个 checkout 作用域的 SQLite 数据库。Dispatch、event 与 receipt 只记录 runtime 实际观察到的事实；每个新边界推进一次 committed run sequence，duplicate delivery 则保留原 effect 与 sequence。带保护的 checkpoint 和有界 context packet 都是可丢弃投影。可选的 `rsp.manage-runtime@1.0` adapter 只关联宿主已确认的 managed run、精确 dispatch 与 worker identity、结构化 event 与 receipt、attention、pause/resume、显式 terminal boundary 和有界 context。Worker event 必须对应已存在且 identity 匹配的 dispatch。Context save 与 hydration 只使用 runtime service clock，任何后续 committed observation 都会使旧 packet 失鲜。它不会解析 worker prose、创建 worker、调度 retry，也不拥有 routing、acceptance、closeout 或 Git。

Managed run 与 attention projection 最多返回 32 个带 source reference 的条目，并明确保持非权威。Resume context 上限为 12 KiB、24 小时。Hydration 必须重新验证 checkout、WorkRef、Git、dirty paths、authority、过期时间与完整 source identity，重新读取当前 authority 指针并加载变化的 evidence；authority 或 checkout drift 会要求完整重读。删除或丢失数据库只会移除 runtime 便利能力；Markdown 工作、历史、就绪性、生命周期和无 runtime 的 Manage 行为保持不变。

软件包安装与普通 Markdown/CLI 的边界是 Node.js `>=22`。可选 runtime 惰性使用 Node.js 内置的 `node:sqlite`，并要求 Node.js `>=22.13.0`，且不安装 native SQLite addon。使用更早的 Node 22 版本或显式禁用 SQLite 时，runtime 打开会返回精确诊断，而普通 CLI 检查仍然可用。

默认软件包不会把保留的 Web Observatory 源码暴露为 CLI 命令、Broker route、projector entry 或浏览器 asset。Markdown artifacts、一次性 CLI 查询与可选 runtime API 仍是受支持的观测面。

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
