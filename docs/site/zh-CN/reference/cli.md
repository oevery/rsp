# CLI 参考

环境中已经可以直接调用 RSP 时使用 `rsp <command>`。评估 beta 版本时固定精确的包版本：`npx -y @oevery/rsp@3.1.0-beta.5 <command>`。

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

## Specs 与工作创建

```text
rsp add spec <name>             创建 Spec 并重建受影响的生成索引
rsp create <name> [summary]     创建 Change；可加 --lite 使用较短模板
rsp group create <name> [goal] 创建不进入聚焦状态的 Group Brief
rsp group close <name>         归档已完成的 Group Brief
rsp group reopen <name> --reason <text>
                                把一份保留的 Group Brief 恢复为未完成工作
```

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

`rsp ready` 和 `rsp show` 提供确定性的就绪信息与语义审查信号，但不会把这些信号视为归档批准。`rsp archive --dry-run` 作为 `rsp ready` 已弃用的兼容别名保留，不会移动 Change。

## 检查与查询

```text
rsp ui [--lang auto|en|zh-CN]   打开只读交互式面板
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
rsp check [--focused] [--json [--compact]] [--verbose]
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

在真实的交互式终端中，不带子命令的 RSP 会打开与 `rsp ui` 相同的面板。CI、管道、重定向流与 `TERM=dumb` 接收静态命令输出。

`status` 从完整工作树派生精确的依赖、就绪工作、阻塞项与稳定波次。`check` 校验 Change 结构，并警告未完成的占位符或待澄清标记。`history` 直接读取保留的归档文件，默认返回 20 条、最多 100 条；筛选参数包括 `--limit`、`--since`、`--until`、`--kind`、`--group` 与 `--search`。

产生 JSON 的命令——`status`、`show`、`ready`、`check`、`doctor` 和 `history`——支持 `--json --compact`，把相同值序列化成一行并以 LF 结尾。不带 `--json` 使用 `--compact` 无效。

## 面板快捷键

- `Tab`：切换“变更”“变更组”与“历史”视图。
- 方向键或 `j`/`k`：移动选择。
- `/`：筛选当前范围。
- `Enter`：打开全宽详情。
- `r`：刷新当前范围。
- `?`：帮助。
- `q`、`Ctrl-C` 或顶层 `Esc`：退出。

面板只本地化自身标签，不会本地化 CLI 帮助、文本输出、JSON、路径、命令、Skills 或已有产物。
