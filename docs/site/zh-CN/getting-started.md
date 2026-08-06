# 五分钟入门

RSP 3.1 需要 Node.js 22 或更高版本。接入和维护命令使用当前稳定版本。

## 初始化项目

```bash
npx -y @oevery/rsp@latest init --with-project-setup
```

该命令创建 `.rsp/` 基础结构、确保 `AGENTS.md` 中存在 RSP 入口，并创建 `.rsp/changes/project-setup.md`。填写该 Change 和 `.rsp/specs/design.md`，然后检查接入：

```bash
npx -y @oevery/rsp@latest doctor
npx -y @oevery/rsp@latest status
```

如果除了初始化项目还需要打印最终的 `AGENTS.md` 内容，使用 `init --agents-mode print`。RSP 只拥有 `<!-- rsp:begin -->` 与 `<!-- rsp:end -->` 之间的区块；周围的项目指令仍归项目所有。

## 开始一个变更

```bash
rsp create improve-login "让登录失败信息可供用户采取行动"
rsp focus improve-login
rsp show --focused
```

编辑 `.rsp/changes/improve-login.md`，保留规范的 Proposal、Spec、Design、Tasks、Verify 与 Blockers 章节。聚焦标记选择当前工作；仅仅存在于 `changes/` 的未完成 Change 不会自动成为当前目标。

对于有意跟踪的小任务，`rsp create --lite <name>` 使用较短模板。不要为每个简单的会话任务创建持久跟踪。

没有聚焦的 Change 且用户未提供具体任务时，询问要处理什么，或建议使用 `npx -y @oevery/rsp create <name>` 创建需要跟踪的工作。简单的当前会话任务默认不应创建 RSP Change，除非确实需要持久跟踪。

## 推进到验收

1. 阅读最近的 `AGENTS.md`、相关上下文、聚焦的 Change，以及实际拥有受影响行为的 Specs 或 Decision Records。
2. 在实现前解决结果、范围、非目标、验收条件或设计中的实质性不确定项。
3. 在明确的修改权限内实现，并运行最新且与风险相称的验证。
4. 用当前结果更新 Tasks、Verify 和 Blockers，不记录执行流水账。
5. 判断稳定事实、长期理由或作用域指令是否需要持久化的归属位置。
6. 仅在满足验收条件、必需检查通过且没有阻塞项后归档。

归档不授予 Git、发布或部署权限。应重新检查工作树，并分别取得这些权限。

## 安装项目 Skills

从当前精确版本的 RSP 包预览并安装十三项默认 Skills：

```bash
npx -y @oevery/rsp@latest skills install --dry-run
npx -y @oevery/rsp@latest skills install
```

可选的纯报告结构审计按精确名称安装：

```bash
rsp skills install rsp-structural-audit --dry-run
rsp skills install rsp-structural-audit
```

接下来阅读[核心概念](./concepts.md)，或直接遵循[日常工作流](./guides/daily-workflow.md)。
