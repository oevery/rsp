# 五分钟入门

RSP 3.1 需要 Node.js 22 或更高版本。进行 opt-in beta 评估时，应固定精确 prerelease 身份，避免仓库下面的工作流版本自行漂移。

## 初始化项目

```bash
npx -y @oevery/rsp@3.1.0-beta.5 init --with-project-setup
```

该命令创建 `.rsp/` 基础结构、确保 `AGENTS.md` 中存在 RSP entry，并创建 `.rsp/changes/project-setup.md`。填写该 Change 和 `.rsp/specs/design.md`，然后检查接入：

```bash
npx -y @oevery/rsp@3.1.0-beta.5 doctor
npx -y @oevery/rsp@3.1.0-beta.5 status
```

如果除了初始化项目还需要打印最终 `AGENTS.md` 内容，使用 `init --agents-mode print`。RSP 只拥有 `<!-- rsp:begin -->` 与 `<!-- rsp:end -->` 之间的 block；周围项目指令仍由项目所有。

## 开始一个变更

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show --focused
```

编辑 `.rsp/changes/improve-login.md`，保留 canonical Proposal、Spec、Design、Tasks、Verify 与 Blockers section。Focus marker 选择当前工作；仅仅存在于 `changes/` 的 open Change 不会自动成为当前目标。

对于有意跟踪的小任务，`rsp create --lite <name>` 使用较短模板。不要为每个 trivial session task 创建持久跟踪。

没有 focused Change 且用户未提供具体任务时，询问要处理什么，或 suggest `npx -y @oevery/rsp create <name>` for tracked work。简单的当前会话任务默认不应创建 RSP change，除非有意需要跟踪。

## 推进到验收

1. 阅读 nearest `AGENTS.md`、相关上下文、focused Change，以及实际拥有受影响行为的 Specs 或 Decision Records。
2. 在实现前解决 outcome、scope、non-goals、acceptance 或 design 中的实质性不确定项。
3. 在明确 mutation authority 内实现，并运行 fresh、成比例的 verification。
4. 用当前结果更新 Tasks、Verify 和 Blockers，不记录执行流水账。
5. 判断稳定事实、长期理由或作用域指令是否需要 durable owner。
6. 仅在 acceptance 与必需检查通过且没有 blocker 后 archive。

Archive 不授予 Git、publication 或 deployment 权限。应重新检查 worktree，并分别取得这些权限。

## 安装项目 Skills

从当前精确 RSP package 预览并安装十一项默认 Skills：

```bash
npx -y @oevery/rsp@3.1.0-beta.5 skills install --dry-run
npx -y @oevery/rsp@3.1.0-beta.5 skills install
```

可选的 report-only structural audit 按精确名称安装：

```bash
rsp skills install rsp-structural-audit --dry-run
rsp skills install rsp-structural-audit
```

接下来阅读[核心概念](./concepts.md)，或直接遵循[日常工作流](./guides/daily-workflow.md)。
