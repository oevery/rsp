# CLI 参考

环境中已经可以直接调用 RSP 时使用 `rsp <command>`。评估 beta 时固定精确 package identity：`npx -y @oevery/rsp@3.1.0-beta.5 <command>`。

## Setup 与 Skills

```text
rsp init --agents-mode <mode>   搭建 .rsp/ 并确保 AGENTS.md 中有 RSP entry
rsp init --with-project-setup   同时创建 .rsp/changes/project-setup.md
rsp update                      刷新受管项目文件，不更新 packaged Skills
rsp doctor [--fix]              检查接入健康；只修复安全 deterministic 问题
rsp skills                      在 dual TTY 中打开项目 Skill manager
rsp skills list [--json]        列出 bundled Skills 与精确安装状态
rsp skills install [name] [--dry-run] [--force]
                                安装默认套件或一个精确 optional Skill
```

`rsp update` 不刷新已安装的 package-owned Skills；需要单独运行 `rsp skills install`。替换内容不同的 selected Skill directory 或移除识别出的 obsolete package-owned identity 时必须显式使用 `--force`。

`rsp doctor --fix` 只报告真实 filesystem mutation；健康项目会返回 `fixed: []`，并说明无需安全修复。

## Specs 与工作创建

```text
rsp add spec <name>             创建 Spec 并重建受影响的 generated indexes
rsp create <name> [summary]     创建 Change；可加 --lite 使用较短模板
rsp group create <name> [goal] 创建不进入 focus 的 Group Brief
rsp group close <name>         归档已完成的 Group Brief
rsp group reopen <name> --reason <text>
                                把一份 retained Group Brief 恢复为 open work
```

## Focus、readiness 与 lifecycle

```text
rsp focus <name>                把 open Change 标记为当前工作
rsp unfocus <name>              从 focus set 移除 open Change
rsp show <name|--focused> [--json [--compact]] [--verbose]
rsp ready <name> [--json [--compact]] [--verbose]
rsp archive <name>              把已完成 Change 移入 archives
rsp reopen <name> --reason <text> [--from <archive-path>]
                                恢复 acceptance 未完成的 archived Change
```

`rsp ready` 和 `rsp show` 暴露 deterministic readiness 与 semantic-review signals，不会把这些 signals 变成 archive approval。`rsp archive --dry-run` 保留为 `rsp ready` 的 deprecated compatibility alias，不会移动 Change。

## 检查与查询

```text
rsp ui [--lang auto|en|zh-CN]   打开只读 interactive dashboard
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
rsp check [--focused] [--json [--compact]] [--verbose]
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

在真实 interactive terminal 中，不带 subcommand 的 RSP 会打开与 `rsp ui` 相同的 dashboard。CI、pipe、redirected stream 与 `TERM=dumb` 接收静态命令输出。

`status` 从完整 work tree 派生精确 dependencies、ready work、blockers 与 stable waves。`check` 校验 Change 结构，并警告未完成 placeholder 或 clarification marker。`history` 直接读取 retained archive files，默认返回 20 条、最多 100 条；filter 包含 `--limit`、`--since`、`--until`、`--kind`、`--group` 与 `--search`。

产生 JSON 的命令——`status`、`show`、`ready`、`check`、`doctor` 和 `history`——支持 `--json --compact`，把相同值序列化成一行并以 LF 结尾。不带 `--json` 使用 `--compact` 无效。

## Dashboard 快捷键

- `Tab`：切换 Changes、Groups 与 History。
- 方向键或 `j`/`k`：移动选择。
- `/`：筛选当前 scope。
- `Enter`：打开全宽详情。
- `r`：刷新当前 scope。
- `?`：帮助。
- `q`、`Ctrl-C` 或顶层 `Esc`：退出。

Dashboard 只本地化自身标签，不会本地化 CLI help、text output、JSON、paths、commands、Skills 或 existing artifacts。
