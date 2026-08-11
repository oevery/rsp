# CLI 参考

环境中已经可以直接调用 RSP 时使用 `rsp <command>`。接入和维护时通过 `npx -y @oevery/rsp@latest <command>` 调用当前稳定包。

## 接入与 Skills

```text
rsp init --agents-mode <mode>   搭建 .rsp/ 并确保 AGENTS.md 中有 RSP 入口
rsp init --with-project-setup   同时创建 .rsp/changes/project-setup.md
rsp update                      刷新受管项目文件，不更新随包 Skills
rsp doctor [--fix]              检查接入健康；只修复安全且结果确定的问题
rsp skills                      在双 TTY 中打开项目 Skill 管理器
rsp skills list [--json]        列出随包 Skills 与精确安装状态
rsp skills install [name] [--dry-run] [--force]
                                安装默认套件或一个指定的可选 Skill
```

`rsp update` 不刷新已安装且归属软件包的 Skills；需要单独运行 `rsp skills install`。替换内容不同的选定 Skill 目录，或移除已识别的过时软件包自有标识时，必须显式使用 `--force`。

`rsp doctor --fix` 只报告真实的文件系统修改；健康项目会返回 `fixed: []`，并说明无需安全修复。

在生成索引兼容迁移中，`rsp update` 只会移除根 `.rsp/specs/INDEX.md`，或任意 `.rsp/specs/**/00-index.md` 中元数据明确标识为 RSP 生成 Specs 索引、且 `source_dir` 与所在目录精确一致的文件。它会在修改前预检全部候选；如果迁移后的直接 Specs 检查失败，则回滚所有隔离文件。项目自有、不可读或被并发替换的保留路径会让 update 停止，不覆盖也不删除内容。全新初始化与 `rsp add spec` 永远不会创建生成索引。

除非显式使用 `--fix`，`rsp doctor` 始终只读。它会报告仍需 `rsp update` 的可识别索引，也会区分 Broker discovery 的 absent、healthy、stale、invalid、unhealthy、incompatible 状态，checkout runtime 的 absent、healthy、migration-required、incompatible、incomplete、corrupt 状态，以及有界的 fresh 或 stale 可丢弃 context packet。它不会启动或注册 Broker、创建原本不存在的缓存、删除 runtime 数据库，也不会因为 context stale 而阻断 Markdown 恢复。

## Specs 与工作创建

```text
rsp specs [path] [--json [--compact]]
                                派生当前树，或查看一个精确的已返回路径
rsp specs --search <literal> [--limit 1..100] [--excerpt 40..1000]
                                以有界摘录搜索当前 Specs 与 Decision Records
rsp add spec <name>             创建供当前文件直接查询的 Spec
rsp create <name> [summary]     创建按 kind 提示的 Change
rsp group create <name> [goal] 创建不进入聚焦状态的 Group Brief
rsp group close <name>         归档已完成的 Group Brief
rsp group reopen <name> --reason <text>
                                把一份保留的 Group Brief 恢复为未完成工作
```

`rsp specs` 直接读取当前常规 Markdown，不依赖 daemon、数据库或生成导航文件。树、详情与搜索 JSON 会标识 checkout、精确项目相对源路径、文档种类、限制与诊断。搜索采用不区分大小写的字面匹配，默认最多返回 20 条、摘录上限为 240 个 Unicode code points；Specs 树无效或保留索引路径包含项目自有内容时会安全失败。迁移后，该命令就是生成索引的受支持导航替代。进行实质决策或修改前，仍需重新读取返回的源文件。

## 可选本地 Broker

```text
rsp broker status [--json]     检查 discovery 与兼容性，不启动服务
rsp broker start [--json]      启动或复用一个兼容的用户级 Broker
rsp broker stop [--json]       协作停止兼容 Broker，或清理 stale 元数据
rsp broker restart [--json]    将已验证且协议 major 相同的 Broker 替换为新进程
rsp web [--json] [--print-url] 打开当前 checkout 的只读 Observatory
```

Broker 是供后续 runtime 与 Web 能力使用的可选操作传输层。普通 `status`、`check`、`show`、`ready`、`specs`、生命周期、Git 与修复命令仍是一次性路径：它们既不依赖 Broker，也不创建其缓存。Broker 不存在时，`broker status` 同样不创建缓存，并以成功状态报告 absent。

`broker restart` 会在同一个 startup lock 内完成协作停止或 stale discovery 恢复，并发布新的 daemon。只要 Broker 健康、身份已验证且协议 major 相同，即使其协议 minor 或 runtime schema 与当前包不兼容，也可以直接替换。协议 major 不同或 owner 不健康时，仍必须使用兼容包处理，并且不会直接向 PID 发送信号。Restart 会丢弃已加载的 project session、Web bearer、SSE 连接与旧 endpoint；需要重新打开的页面应再次运行 `rsp web`。

仓库迁移与 runtime 缓存处置是两项独立操作。Update 和 doctor 不会移除 runtime 数据库或 sidecar。只有明确授权处置并关闭精确 Broker/session/store owner 后，才从 `@oevery/rsp/dist/runtime-store.mjs` 导入 `resolveRuntimeDisposalTarget()` 与 `disposeRuntimeDatabase()`，派生当前 checkout 的精确 cache/projects/namespace target，并把这个完整 target 交回处置 API。不要手工删除 runtime 文件、删除整个 Broker 缓存根目录、猜测 project identity、在 checkout 之间复制数据库，也不要手工向记录的 PID 发送信号。

并发启动通过一个完整记录原子可见的用户级锁串行化，所有兼容客户端返回同一个健康 instance 与 endpoint。一次性 startup claim 会从启动客户端原子移交给唯一 daemon；迟到的 loser 会自行退出，不会替换 discovery。只要支持 managed observability 的 Broker protocol `1.2` 与所需 runtime schema `1.1` 兼容，不同软件包版本也可复用该进程；低于客户端要求的旧 minor 会被拒绝，兼容的新 minor 可以复用。不兼容客户端不会暗中启动 side-by-side 服务，而会返回精确操作：先用兼容软件包停止现有 Broker，再以目标版本重试。

服务只绑定精确的 `http://127.0.0.1:<port>`，并检查 loopback peer、`Host`、可选浏览器 `Origin` 与 bearer token；CLI 输出永远不打印 control token 或 project token。规范化 Git checkout 路径加文件系统身份会把不同仓库和同一 Git 仓库的不同 worktree 隔离为不同 project session、token 与 namespace；同一 checkout 的并发注册返回该已加载 session 的唯一规范 token。所有 JSON 响应都会在发送 headers 前检查 64 KiB 上限，status 在限制可选 session 列表的同时保留精确总数。非活跃 session 默认五分钟后卸载，但不会删除仓库文件，也不会让 runtime 状态成为权威事实。

`rsp web` 是唯一会显式启动 Broker 并注册当前 checkout 的基础浏览器操作。它打开的 URL 只在 fragment 中携带一个一分钟有效、仅可使用一次的 bootstrap；初始文档和随包 assets 不会收到该 fragment，浏览器会在 API 访问前把它移除，并由精确 Broker origin 兑换独立的内存 Web bearer。正常输出和 `--json` 只显示无凭据 project URL；非交互执行不会生成 bootstrap。仅在无法打开浏览器时，于人类控制的交互终端使用 `--print-url`；该输出属于短期凭据，不应重定向或复制到日志。

Observatory 的少量界面标签仅使用英文，并以紧凑响应式布局提供 Overview、Specs、History、Runs 与 Attention。Overview 在服务端派生当前工作、目标、状态、blockers、diagnostics 与 next action；Specs 和 History 复用 CLI 的有界当前文件查询与详情投影。Runs 和 Attention 只消费非权威的 Manage-owned projection；兼容 runtime state 缺失时会明确显示 unavailable。浏览器不解析 Markdown，不把凭据写入 cookie 或浏览器存储，也不存在写入、生命周期、命令、Git、runtime mutation、账号、云端或远程路由。

只有全部 section 成功后，refresh 才会整体替换 projection version `1.1` 的完整 snapshot。Managed SSE reconnect 使用有界 replay，或在 sequence gap 时执行一次 fresh snapshot recovery。刷新失败或 bundle 收到不兼容投影时，上一份完整 snapshot 会继续显示并明确标记为 stale，同时展示有界错误。关闭页面后轻量 session heartbeat 与 managed stream 会停止，project session 随正常 idle policy 卸载；`rsp broker stop` 可显式关闭该可选服务。Broker 或 Web 不可用时，普通 `rsp status`、`rsp specs`、`rsp history`、readiness、生命周期与 Git 工作仍不受影响。

显式 runtime 消费者会通过随包的 `dist/runtime-store.mjs` adapter，在对应 project namespace 中惰性打开 `runtime-v1.sqlite`。当前数据库 identity 是 schema major `1`、migration version `3`，它与 Broker protocol `1.2` 和 runtime-schema compatibility identity `1.1` 相互独立。Store 使用内置 `node:sqlite`、WAL、短事务、幂等投递、事务化 sequence 分配、带保护 checkpoint、有界 context、retention 与 project-local disposal。它只记录 runtime observations，不拥有规划、blocker、readiness、acceptance、生命周期、Git 或发布。

宿主可以 import 随包的 `dist/manage-runtime.mjs`，通过已接受的 store 直接使用，或经 project-token-scoped Broker endpoint 使用可选 capability `rsp.manage-runtime@1.0`。该 capability 的 Broker discovery 不会启动服务。Adapter 只记录宿主已确认的 run、精确 dispatch 与 worker identity、结构化 event 与 receipt、attention、pause/resume、显式 terminal boundary 和 context。每个新 observation（包括 dispatch）推进一次 committed run sequence；duplicate delivery 保留原 effect 与 sequence。Worker event 必须对应已存在且 identity 匹配的 dispatch，missing、unavailable 或 boundary-changing receipt 始终保持 incomplete。Run 与 attention projection 非权威、带 source reference，且最多 32 项。`terminalDeliveryObserved` 同样 non-authoritative，只在存在显式 terminal boundary、至少一个 dispatch、无 truncation 且每个 observed dispatch 都有安全 retained delivery 时为 true。Context packet 上限为 12 KiB、24 小时；public save/hydrate request 不暴露 caller clock，任何后续 committed observation 都会使旧 packet 失鲜。Resume 始终重读当前 authority 与变化的 source，authority 或 checkout identity stale 时执行完整重读。Runtime 缺失或失败只产生诊断，并保留规范的无 runtime Manage 结果。

软件包要求 Node.js `>=22.13.0`，且不声明 native SQLite addon。以 `--no-experimental-sqlite` 启动 Node 时，runtime 打开返回 `runtime_sqlite_unavailable`；普通一次性 CLI 命令不会 import SQLite，因此仍可使用。

显式设置时 discovery 使用 `RSP_BROKER_CACHE_HOME`；否则在支持的 Unix 主机上遵循 XDG cache，在 Windows 上使用 `LOCALAPPDATA`，在 macOS 上使用用户缓存目录，其余主机回退到 `~/.cache`。停止前会重新验证进程启动身份与元数据文件身份：dead 或已复用 PID 只触发元数据清理，绝不会收到信号；身份不可观察时则安全失败。

## 聚焦、就绪与生命周期

```text
rsp focus <name>                把未完成的 Change 标记为当前工作
rsp unfocus <name>              从聚焦集合移除未完成的 Change
rsp show <name|--focused> [--json [--compact]] [--verbose]
rsp ready <name> [--json [--compact]] [--verbose]
rsp archive <name>              把已完成 Change 移入归档目录
rsp reopen <name> --reason <text> [--from <archive-path>]
                                恢复未满足验收条件的已归档 Change
```

`rsp ready` 和 `rsp show` 分别提供必须完成门禁、可选覆盖警告与语义审查信号。未完成的 Tasks、Required Verify 或 blocker 会产生 `archiveReady: no`；未完成的 Optional 验证只保留警告。完成门禁被阻断时，`rsp archive` 会失败且不移动 Change。`rsp archive --dry-run` 作为 `rsp ready` 已弃用的兼容别名保留，不会移动 Change。

## 本地 Git 交付

```text
rsp commit --message-file <path> [--json]
```

`rsp commit` 基于当前已经暂存的边界创建一个本地 commit。它不会主动 stage、push、tag、发布、amend，也不会创建修复提交。消息文件必须包含真实换行；字面量 `\n` 会被拒绝。Git 通过直接子进程的 stdin 路径接收消息，并使用 `--cleanup=verbatim`；提交完成后还会检查 `HEAD` 的完整消息。如果提交后的消息不匹配，命令会报告失败，但保留已经创建的 commit，后续历史修复仍需单独授权。

## 隔离 Workspace

```text
rsp workspace prepare <work-ref> [--target <branch>] [--json]
rsp workspace status <work-ref> [--json]
rsp workspace inspect <work-ref> [--json]
rsp workspace activity register <work-ref> --id <id> --pid <pid>
    [--label <text>] [--process-group <pgid>] [--resources <ids>] [--json]
rsp workspace activity stop <work-ref> --id <id> [--json]
rsp workspace dispose <work-ref> [--discard] [--json]
rsp land <work-ref> --target <branch> --commits <sha[,sha...]> [--cleanup] [--json]
```

Workspace 只为一个已有且可执行的 WorkRef 显式启用，并且必须满足项目的 `workspace.activation` 策略。`auto` 允许 Core 根据实质 workspace 信号选择隔离，`explicit` 要求当前存在显式请求，`disabled` 则禁止 RSP 选择 workspace。准备命令在稳定缓存目录中创建或恢复 `rsp/<work-ref>` 分支；普通临时工作仍在当前分支完成。`inspect` 只返回有界仓库事实，不判断项目技术栈。

`rsp-workspace` Skill 或人类负责理解项目语义，并使用宿主现有的文件、shell、包管理、浏览器和进程能力。该 Skill 复用调用方已有的 RSP 控制与结果契约，只追加 workspace 上下文和观察事实；CLI 不解析 AI 响应文本，也不提供通用执行计划 DSL。

长运行进程由宿主启动并验证。`activity register` 登记已观察到的 PID 及其稳定进程启动身份、可选且已核验的进程组，以及不透明的协作式资源名称，使后续会话可以安全停止或清理。停止和清理前会重新验证该身份；如果 PID 或进程组已被复用则安全失败，不会发送信号。登记属于协作协调，不是沙箱，也不会授予网络、凭证、外部状态、部署或发布权限。

清理会拒绝存在未提交修改或仍领先目标分支的 commit；`--discard` 才显式授权丢弃两者。回迁要求精确目标分支和有序 commit 列表。冲突会保留来源 workspace 和目标 cherry-pick 状态；只有回迁成功且列表覆盖 workspace 相对目标领先的全部 commit 时，`--cleanup` 才会继续清理。

## 检查与查询

```text
rsp ui [--lang auto|en|zh-CN]   打开只读交互式面板
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
rsp check [--focused] [--json [--compact]] [--verbose]
rsp specs [path|--search <literal>] [--json [--compact]]
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

在真实的交互式终端中，不带子命令的 RSP 会打开与 `rsp ui` 相同的面板。CI、管道、重定向流与 `TERM=dumb` 接收静态命令输出。

普通 `rsp status` 以紧凑形式保留当前聚焦、Change 与 Group 摘要、进度、阻塞项和派生的下一步。增加 `--verbose` 可查看有效 Manage 与语言策略、完整依赖森林和归档趋势。JSON 输出不受纯文本展示模式影响。

`status` 从完整工作树派生精确的依赖、就绪工作、阻塞项与稳定波次。`check` 校验 Change 结构，并警告未完成的占位符或待澄清标记。`history` 直接读取保留的归档文件，默认返回 20 条、最多 100 条；筛选参数包括 `--limit`、`--since`、`--until`、`--kind`、`--group` 与 `--search`。

产生 JSON 的命令——`status`、`show`、`ready`、`check`、`doctor`、`specs` 和 `history`——支持 `--json --compact`，把相同值序列化成一行并以 LF 结尾。不带 `--json` 使用 `--compact` 无效。

## 面板快捷键

- `Tab`：切换“变更”“变更组”与“历史”视图。
- 方向键或 `j`/`k`：移动选择。
- `/`：筛选当前范围。
- `Enter`：打开全宽详情。
- `r`：刷新当前范围。
- `?`：帮助。
- `q`、`Ctrl-C` 或顶层 `Esc`：退出。

面板只本地化自身标签，不会本地化 CLI 帮助、文本输出、JSON、路径、命令、Skills 或已有产物。
