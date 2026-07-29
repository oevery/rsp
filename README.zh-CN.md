# RSP — Reliable Software Practice

[English](./README.md) | 简体中文

**面向人类与 AI agent 的仓库原生工程工作流。**

RSP 把模糊意图转化为经过塑造、实现、审查和验证的软件变更，同时让项目知识可持久化、工作可恢复。它使用普通仓库文件——Rules、Specs 和 Plans——而不是隐藏的工作流状态。

## RSP 帮助你完成什么

- 把模糊工作塑造成一个可执行 Change。
- 在实现前根据仓库证据解决设计问题。
- 把诊断、实现、TDD、审查和发布工作路由给明确能力。
- 把当前事实、长期理由、作用域指令和完成历史保存在正确 owner 中。
- 保持权限可见：RSP 不会推断 commit、publication、deployment 或 approval 权限。

```text
intent → shape → design when needed → diagnose | TDD | implement
       → review → durable review → archive
```

## 五分钟入门

RSP 3.1 需要 Node.js 22 或更高版本。评估 prerelease 时请固定精确版本：

```bash
npx -y @oevery/rsp@3.1.0-beta.5 init --with-project-setup
# 填写 .rsp/changes/project-setup.md
# 填写 .rsp/specs/design.md
npx -y @oevery/rsp@3.1.0-beta.5 doctor
```

然后创建并聚焦一个受跟踪变更：

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show --focused
```

遵循 nearest `AGENTS.md`，在工作推进时同步 focused Change，运行 fresh project checks，完成 durable-update 判断，并仅在 acceptance 满足后归档。

[阅读完整入门指南](./docs/zh-CN/getting-started.md)。

## Artifact 模型

```text
.rsp/
├── rsp-rules.md       # minimal fallback protocol
├── specs/             # durable current facts
├── changes/           # open work
├── focus.d/           # 选择当前工作的空 marker
└── archives/          # completed history
```

一个 Change 是包含 canonical Proposal、Spec、Design、Tasks、Verify 和 Blockers section 的单个 Markdown 文件。稳定事实属于 Specs，长期理由属于 Decision Records，稳定且有作用域的操作指令属于 nearest project-owned `AGENTS.md`。

## 文档

- [开始使用](./docs/zh-CN/getting-started.md)
- [核心概念与 artifact owner](./docs/zh-CN/concepts.md)
- [日常工作流](./docs/zh-CN/guides/daily-workflow.md)
- [Skills 与 managed work](./docs/zh-CN/guides/skills.md)
- [配置参考](./docs/zh-CN/reference/configuration.md)
- [CLI 参考](./docs/zh-CN/reference/cli.md)
- [3.0 迁移指南](./docs/migrations/3.0.md)与 [3.1 迁移指南](./docs/migrations/3.1.md)
- [发布说明](./docs/releases/3.1.0-beta.5.md)
- [设计哲学](./docs/design-philosophy.md)与[维护者 upstream research](./docs/upstreams.md)

在本地运行文档：

```bash
pnpm docs:dev
pnpm docs:check
pnpm docs:build
```

网站只是本仓库 Markdown 的 presentation layer。它提供双语导航、本地搜索和页面目录，不引入内容数据库或运行时服务。

## 平台支持

RSP 是工具无关的文件约定，适用于任何能读取项目文件的 assistant 或 editor。人类从这里开始；agent 遵循 nearest `AGENTS.md`，优先加载 `skills/rsp/SKILL.md`，仅在 Skill 不可用时使用 `.rsp/rsp-rules.md` fallback protocol。

RSP 使用 [MIT License](./LICENSE)。
