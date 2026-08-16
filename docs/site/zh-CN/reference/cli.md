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

除非显式使用 `--fix`，`rsp doctor` 始终只读。它会报告接入和文件系统问题，包括仍需 `rsp update` 的可识别索引，并且不会创建隐藏工作流状态。

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

在下一次兼容发布的一个兼容周期内，`rsp create --lite`、`--lite=true` 与 `--lite=false` 仍会被接受。每种形式都会输出有界弃用提示，并创建同一套标准 kind-aware 六章节 Change；其他 `--lite=` 值会在修改前失败，且不存在单独的 lite 模板。

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

Workspace 只为一个已有且可执行的 WorkRef 启用，并且必须满足项目的 `workspace.activation` 策略。Workspace 默认是 `explicit`，要求当前明确请求隔离；`auto` 是项目主动启用的高级选项，还允许根据实质 workspace 信号选择隔离；`disabled` 则禁止 RSP 选择 workspace。选择必须在准备前重新确认。Workspace 属于修改前基础设施，不会静默迁移已经在源 checkout 开始的产品修改。准备命令在稳定缓存目录中创建或恢复 `rsp/<work-ref>` 分支；普通临时工作仍在当前分支完成。`inspect` 只返回有界仓库事实，不判断项目技术栈。

`rsp-workspace` Skill 或人类负责理解项目语义，并使用宿主现有的文件、shell、包管理、浏览器和进程能力。该 Skill 复用调用方已有的 RSP 控制与结果契约，只追加 workspace 上下文和观察事实；CLI 不解析 AI 响应文本，也不提供通用执行计划 DSL。

长运行进程由宿主启动并验证。`activity register` 登记已观察到的 PID 及其稳定进程启动身份、可选且已核验的进程组，以及不透明的协作式资源名称，使后续会话可以安全停止或清理。停止和清理前会重新验证该身份；如果 PID 或进程组已被复用则安全失败，不会发送信号。登记属于协作协调，不是沙箱，也不会授予网络、凭证、外部状态、部署或发布权限。

清理会拒绝存在未提交修改或真正尚未交付的 commit。若一个干净 Workspace 的领先 commit 已在目标分支存在补丁等价版本，其 `deliveryState` 为 `landed-equivalent`，无需 `--discard` 即可普通清理；补丁等价不代表 Change 已验收。`--discard` 才显式授权丢弃 dirty 或未交付工作。回迁要求精确目标分支和有序 commit 列表。冲突会保留来源 workspace 和目标 cherry-pick 状态；只有回迁成功且列表覆盖 workspace 相对目标领先的全部 commit 时，`--cleanup` 才会继续清理。

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

普通 `rsp status` 以紧凑形式保留当前聚焦、Change 与 Group 摘要、进度、阻塞项和派生的下一步，同时显示每个活动 Workspace 及 inspect 或 dispose 恢复动作。增加 `--verbose` 可查看有效 Manage 与语言策略、完整依赖森林、归档趋势和更详细的活动 Workspace 恢复事实。JSON 新增稳定排序的 `activeWorkspaces` 数组，字段为 `workRef`、`branch`、`targetBranch`、`dirty`、`commitsAhead`、`activeActivityCount`、`deliveryState` 和 `cleanupReady`；`deliveryState` 取值为 `clean`、`unlanded` 或 `landed-equivalent`。这些值来自现有 Workspace 注册表的已校验机械观察，不代表 Change readiness 或 acceptance；无效记录会显式失败。默认纯文本 status 不显示机器相关的 Workspace 路径，status 也不会创建第二注册表或工作流状态。

`status` 从完整工作树派生精确的依赖、就绪工作、阻塞项与稳定波次。`check` 校验 Change 结构，并警告未完成的占位符或待澄清标记。`history` 直接读取保留的归档文件，默认返回 20 条、最多 100 条；筛选参数包括 `--limit`、`--since`、`--until`、`--kind`、`--group` 与 `--search`。

产生 JSON 的命令——`status`、`show`、`ready`、`check`、`doctor`、`specs` 和 `history`——支持 `--json --compact`，把相同值序列化成一行并以 LF 结尾。不带 `--json` 使用 `--compact` 无效。

## 面板快捷键

- `Tab`：切换“工作”“Specs”与“历史”视图；“工作”用明确类型标签合并展示 Change 和 Group。
- 在 Specs 中按 `s` 提交有界字面正文搜索；`Enter` 打开经过安全终端渲染的 Markdown 详情，`↑`/`↓` 或 `k`/`j` 按渲染后的行滚动。Frontmatter 会隐藏，raw HTML 不会执行。
- 在 Work 或 History 详情中按 `v`，可在语义化的 Status/Summary 与精确有界 Markdown 文档之间切换。表格会适配终端宽度，严格 RSP metavariable 保持惰性展示。
- 方向键或 `j`/`k`：移动选择。
- `/`：筛选当前范围。
- `Enter`：打开全宽详情。
- `r`：刷新当前范围。
- `?`：帮助。
- `q`、`Ctrl-C` 或顶层 `Esc`：退出。

面板只本地化自身标签，不会本地化 CLI 帮助、文本输出、JSON、路径、命令、Skills 或已有产物。
