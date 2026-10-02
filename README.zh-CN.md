# RSP — Reliable Software Practice

[English](./README.md) | 简体中文

**面向人类与 AI 智能体的仓库原生工程工作流。**

RSP 把模糊意图转化为经过塑造、实现、审查和验证的软件变更，同时让项目知识可持久化、工作可恢复。它使用普通仓库文件——规则、规格和计划——而不是隐藏的工作流状态。

## RSP 帮助你完成什么

- 把模糊工作塑造成一个可执行 Change。
- 在实现前根据仓库证据解决设计问题。
- 把诊断、实现、TDD、审查和发布工作路由给明确的能力。
- 把当前事实、长期理由、作用域指令和完成历史保存在正确的归属位置。
- 保持权限可见：RSP 不会推断提交、发布、部署或批准权限。

```text
意图 → 塑造 → 必要时设计 → 诊断 | TDD | 实现
     → 审查 → 持久化审查 → 归档
```

## 五分钟入门

RSP 需要 Node.js 22（`>=22`），从目标项目根目录执行初始化。后续 `rsp` 示例要求该命令已可用；否则通过 `npx -y @oevery/rsp@latest <command>` 调用同一选定包。使用当前稳定版本：

```bash
npx -y @oevery/rsp@latest init --with-project-setup
# 填写 .rsp/changes/project-setup.md
# 填写 .rsp/specs/design.md
npx -y @oevery/rsp@latest doctor
npx -y @oevery/rsp@latest status
```

然后创建并聚焦一个受跟踪变更：

```bash
rsp create improve-login "让登录失败信息可供用户采取行动"
rsp focus improve-login
rsp show improve-login
```

Focus 是一个集合：project-setup 和 improve-login 可以同时聚焦。使用明确名称查看目标；show --focused 要求恰好一个标记。

确认 `doctor` 显示预期的项目设置，`status` 显示预期工作；这些是确定性观察，不是语义验收。遵循最近的 `AGENTS.md`，保持选中的 Change 与实际结果同步，运行最新的必需检查并判断持久化更新。只有验收满足且具备生命周期权限时，才通过 `rsp archive` 归档。

[阅读完整入门指南](./docs/site/zh-CN/getting-started.md)。

## 产物模型

```text
.rsp/
├── rsp-rules.md       # 最小后备协议
├── specs/             # 当前契约、边界与必要约束
├── changes/           # 未完成工作
├── focus.d/           # 工作选择标记；可附短恢复胶囊
└── archives/          # 已完成历史
```

一个 Change 是包含规范的 Proposal、Spec、Design、Tasks、Verify 和 Blockers 章节的单个 Markdown 文件。稳定事实属于 Specs，长期理由属于 Decision Records，稳定且有作用域的操作指令属于最近的项目自有 `AGENTS.md`。

## 文档

- [开始使用](./docs/site/zh-CN/getting-started.md)
- [核心概念与产物归属](./docs/site/zh-CN/concepts.md)
- [日常工作流](./docs/site/zh-CN/guides/daily-workflow.md)
- [Skills 与受管工作](./docs/site/zh-CN/guides/skills.md)
- [配置参考](./docs/site/zh-CN/reference/configuration.md)
- [CLI 参考](./docs/site/zh-CN/reference/cli.md)
- [3.0 迁移指南](./docs/migrations/3.0.md)与 [3.1 迁移指南](./docs/migrations/3.1.md)
- [发布说明](./docs/releases/3.3.0.md)
- [维护者测试与 Skill 验证](./tests/README.md)
- [设计哲学](./docs/maintainers/design-philosophy.md)与[维护者上游研究](./docs/maintainers/upstreams.md)

在本地运行文档：

```bash
pnpm docs:dev
pnpm docs:check
pnpm docs:build
```

网站只是本仓库 Markdown 的展示层。它提供双语导航、本地搜索和页面目录，不引入内容数据库或运行时服务。

## 平台支持

RSP 是与工具无关的文件约定，适用于任何能读取项目文件的助手或编辑器。人类从这里开始；AI 智能体遵循最近的 `AGENTS.md`，通过宿主 Skill discovery 或 `.agents/skills/rsp/SKILL.md` 加载可用的项目 Core，仅在 Skill 不可用时使用 `.rsp/rsp-rules.md` 后备协议。根目录 `skills/` 是 RSP 仓库中的分发源码，不是消费者的安装入口。

RSP 使用 [MIT 许可证](./LICENSE)。
