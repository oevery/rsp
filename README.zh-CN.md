# RSP：Rules, Spec, Plan

RSP = **Rules（规则）、Spec（规格）、Plan（计划）** — 轻量级 AI 辅助开发工作流。

## 你会得到什么

| 项                       | 路径                             | 用途                         |
| ------------------------ | -------------------------------- | ---------------------------- |
| `rsp` skill              | `.kilo/skills/rsp/SKILL.md`      | 完整 RSP 手册（按需加载）    |
| `rsp-rules` rule         | `.ai/rules/rsp-rules.md`         | 行为约束（每次对话自动注入） |
| `/init-rsp` command      | `.kilo/command/init-rsp.md`      | 初始化项目结构               |
| `/new-feature` command   | `.kilo/command/new-feature.md`   | 开始一个新功能               |
| `/close-feature` command | `.kilo/command/close-feature.md` | 归档完成的功能               |

## 快速安装

```bash
npx @oevery/rsp
```

然后在 `~/.config/kilo/kilo.jsonc` 中添加：

```json
{
  "instructions": ["~/.config/kilo/.ai/rules/rsp-rules.md"]
}
```

## 什么是 RSP

两种模式，一个哲学 — 将业务意图和执行状态保存在 AI 可以直接读取和维护的显式文件中。

### Mode B（单功能模式）

``` bash
.ai/
├── archive/
├── rules.md
├── spec.md
└── plan.md
```

一次一个活跃功能。完成后归档到 `.ai/archive/`。

### Mode A（多功能模式）

``` bash
.ai/
├── rules/
├── specs/
├── plans/
└── archive/
```

多个功能并行开发。按功能包归档。

### 命令

| 命令                    | 用途           |
| ----------------------- | -------------- |
| `/init-rsp`             | 初始化项目结构 |
| `/new-feature <name>`   | 开始新功能     |
| `/close-feature <name>` | 归档并重置     |

## License

MIT

## 工具无关

`.ai/` 目录（rules / spec / plan / archive）是一个纯文件约定 — 不绑定任何工具。它适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 编码助手。

本仓库提供了便捷安装器和 Kilo 专属集成（skill / commands）。要在其他工具中使用 RSP，只需创建 `.ai/` 目录并遵循相同的文件约定即可。
