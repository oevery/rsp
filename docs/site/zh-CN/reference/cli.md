# CLI 参考

`rsp` 表示 AGENTS 与 `.rsp/version` 指定的精确 CLI 调用，或已核验相同版本的可执行文件，不表示 `@latest` 或任意全局安装。源码候选的迁移见[固定版本与 Skills](../guides/skills.md#固定版本与-skills-only-迁移)。

## 接入与 Skills

```text
rsp init --agents-mode <mode>   创建项目文件和完整核心套件
rsp init --with-project-setup   同时创建 project-setup Change
rsp update [--dry-run]          统一更新项目文件、Skills 和版本记录
rsp doctor [--check-updates]    只读诊断；显式检查稳定版本元数据
rsp skills list [--json]        查看套件差异和已知退役名称
```

使用选定目标的 update 完成升级；普通命令继续使用项目记录的精确版本。重复 init 不采用新版本，不支持降级。独立 skills install、安装终端及 doctor --fix 已退役。

更新替换明确列出的核心 Skills，移除已知旧名称和两处退役 Rules，只刷新 AGENTS 的受管块。更新前自行保存受管资产中需要的定制内容；未知 Skills、用户配置、项目知识及 AGENTS 其他部分保留。可选 --dry-run 预览无需 force，也不会写入。

失败停止，不回滚已完成步骤，也不生成恢复副本；排除原因后用同一目标 CLI 重跑。update 不改写 config、不修复用户目录，版本最后写入，不支持崩溃恢复。诊断不授予修改权限；候选职责映射见 [Skills 指南](../guides/skills.md)。
缺失的用户脚手架可自行恢复，或用 init 创建默认内容；权限及路径类型错误应由用户纠正，update 不修复这些路径。

生成索引兼容迁移只移除根 INDEX.md 或任意 00-index.md 中带有精确生成元数据的 Specs 索引。预检和所有权检查保护用户内容；全新初始化与 add spec 不生成索引。Doctor 始终只读，报告需要 update 的问题。

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
rsp focus <name> [--capsule-file <path|->]
                                把 Change 标记为当前工作，并可选替换 capsule
rsp unfocus <name>              从聚焦集合移除未完成的 Change
rsp show <name|--focused> [--json [--compact]] [--verbose]
rsp ready <name> [--json [--compact]] [--verbose]
rsp archive <name>              把已完成 Change 移入归档目录
rsp reopen <name> --reason <text> [--from <archive-path>]
                                恢复未满足验收条件的已归档 Change
```

`rsp focus --capsule-file` 接受常规文件或标准输入（`-`）。空输入保留有效的空 marker。每次新的非空写入都必须是严格 Focus Capsule v1：一个位于开头的 `<!-- rsp-focus:v1 -->`、空行、恰好一个非空单行 `Current`、`Evidence`、`Next`，以及至多一个非空单行 `Resume check`。未知非空行或字段、重复或缺失字段、无效 UTF-8、不安全输入及超过 4096 UTF-8 bytes 的内容都会在原子替换前被拒绝，并保留原 marker。

已有的有界、无版本 UTF-8 内容继续按兼容模式读取。`rsp check` 发出稳定的 `focus_capsule_legacy` warning，且不会把这些文本声明为结构化 recovery。对于 focused Change，`rsp show --json` 对空内容或 legacy 内容返回 `recovery: null`，对 legacy 内容在 `warnings` 中返回稳定条目，并把有效 v1 投影为 `{ version, current, evidence, next, resumeCheck, authoritative: false }`。该投影只读，不授予权限，也不声明证据新鲜度。

`rsp ready` 和 `rsp show` 还会提供必须完成门禁、可选覆盖警告与语义审查信号。未完成的 Tasks、Required Verify 或 blocker 会产生 `archiveReady: no`；未完成的 Optional 验证只保留警告。完成门禁被阻断时，`rsp archive` 会失败且不移动 Change。`rsp archive --dry-run` 作为 `rsp ready` 已弃用的兼容别名保留，不会移动 Change。

## 本地 Git 交付

当前源码候选移除 `rsp commit --message-file`，以及 `--expected-head`、`--expected-tree` 和 JSON 回执，不保留兼容包装器。已有自动化调用方需要迁移；历史发布记录仍描述各自原始版本。

授权的精确本地交付使用 `rsp-commit` Skill，普通执行命令为：

```sh
git commit --cleanup=verbatim -F <message-file>
```

将 `<message-file>` 替换为安全准备、正确引用且不在交付边界内的真实路径。多行正文使用真实换行；字面量反斜杠 n 保持原样。保留正常 Git hooks 和签名策略。

Skill 负责权限、验证、暂存与消息审查、Git 操作状态检查、已审查 HEAD/index 复查，以及不可变提交结果观察。原生 Git 不提供已移除包装器的保护或 JSON 回执。仅有退出码不能证明精确交付；快照漂移、检查失败或副作用不明时停止，不自动重试、amend、reset 或创建修复提交。顺序观察不构成跨进程锁，也不声明等同可靠性或成本收益。

缺少 Commit 能力时，Core 仍停止交付，不暂存也不手动替代。本地交付不授予归档、历史改写、push 或发布权限。

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

普通 `rsp status` 是人类和 AI 的默认语义视图：以紧凑形式保留当前聚焦、Change 与 Group 摘要、进度、阻塞项和派生的下一步。在交互式终端中，使用 `rsp` 或 `rsp ui` 打开面板。只有需要精确机器字段时才使用 `rsp status --json`；默认投影保留当前工作、摘要、依赖、波次和结构化诊断。使用 `rsp status --json --verbose` 可补回过滤器、下一步、归档趋势和运行时诊断。有效项目配置请使用 `rsp config` 或 `rsp config --json`。

`status` 从完整工作树派生精确的依赖、就绪工作、阻塞项与稳定波次。`check` 校验 Change 结构，并警告未完成的占位符或待澄清标记。`history` 直接读取保留的归档文件，默认返回 20 条、最多 100 条；筛选参数包括 `--limit`、`--since`、`--until`、`--kind`、`--group` 与 `--search`。

产生 JSON 的命令——`status`、`show`、`ready`、`check`、`doctor`、`specs` 和 `history`——支持 `--json --compact`，把相同投影序列化成一行并以 LF 结尾。对 `status`，`--json --verbose` 会恢复辅助展示字段和运行时诊断。不带 `--json` 使用 `--compact` 无效。

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
