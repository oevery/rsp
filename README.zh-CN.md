# RSP：Rules, Spec, Plan

RSP = **Rules（规则）、Spec（规格）、Plan（计划）** — 轻量级 AI 辅助开发工作流。

## 快速开始

```bash
# 全局安装
npm install -g @oevery/rsp

# 或用 npx 直接运行
npx @oevery/rsp init

# 在当前项目搭建脚手架
cd my-project && rsp init
```

然后将 \`.rsp/rules/*.md\` 添加到 AI 工具的指令文件中。例如 Kilo Code 的 \`kilo.jsonc\`：

```json
{
  "instructions": [
    ".rsp/rules/*.md"
  ]
}
```

其他工具（Cursor、Claude Code、Copilot）将同一路径添加到对应配置即可。详见[工具无关](#工具无关)。

## 项目结构

```text
.rsp/
├── config.yaml                # 项目配置
├── rules/                     # 技术约束
├── spec/                      # 项目级架构
│   └── INDEX.md               # 从归档提取的 spec 摘要
├── features/                  # 特性文件
│   ├── auth/
│   │   └── login.md
│   └── payments/
│       └── checkout.md
├── active.d/                  # 活跃特性标记（路径即特性名）
│   ├── auth/
│   │   └── login              # 空标记文件
│   └── payments/
│       └── checkout
├── archive/
│   ├── INDEX.md               # 自动生成的归档索引
│   ├── 2026-05-22_login.md
│   └── payments/
│       └── 2026-05-22_checkout.md
```

\`active.d/\` 中的每个条目是一个空文件，路径与 \`features/\` 镜像。多个条目表示并行特性。AI 读取 \`active.d/\` 来确定当前进行中的工作。特性文件可以扁平放置（如 \`login.md\`），也可以按领域子目录组织（如 \`auth/login.md\`、\`payments/checkout.md\`）。

每个功能文件独立自包含，支持可选的 delta 变更标记和结构化场景：

```markdown
---
status: draft
priority: medium
tags:
  - backend
---
# Feature: User Login

## Spec
- Summary: 用户可通过邮箱和密码登录
- Requirements:
  - [ ] 登录表单提交邮箱 + 密码
  - [ ] 后端验证凭据并返回 JWT
### ADDED           # 可选：delta 变更标记
- OAuth 2.0 登录支持
### Scenario: 有效凭据
- GIVEN 一个已注册用户
- WHEN 提交邮箱 + 密码
- THEN 返回 JWT
- Constraints:
  - 密码必须用 bcrypt 哈希

## Plan
- [ ] 阶段 1: 后端 API
  - [ ] 创建 /api/auth/login 端点
  - [ ] 实现密码验证
- [ ] 阶段 2: 前端
  - [ ] 设计登录表单 UI

## Tests
- [ ] tests/auth/login_test.ts — 成功登录
- [ ] tests/auth/login_test.ts — 无效凭据

## Blockers
-
```

## CLI

```text
rsp init               搭建 .rsp/ + AGENTS.md
rsp new <name> [summary]    创建新功能
rsp close <name>       归档到 archive/ + 更新 spec 索引
rsp status             查看项目仪表板（年龄、受阻、趋势）
rsp check              验证功能文件（frontmatter、sections、deps、deltas、scenarios）
rsp deps               查看依赖关系表
rsp deps --mermaid     输出 Mermaid.js 依赖图
rsp archive-index      重新生成归档索引
```

## 自定义

编辑 `.rsp/config.yaml` 可自定义 status、priority 和必要的 sections。

> **注意：** 内置 YAML 解析器支持简单的子集：`key: value` 键值对、嵌套列表（`- item`）和 `#` 注释。不支持多行值、引号字符串、布尔值和嵌套映射。

## 工具无关

\`.rsp/\` 目录是一个纯文件约定 — 不绑定任何工具。适用于 Kilo Code、Cursor、Claude Code、Cline、GitHub Copilot 或任何能读取项目文件的 AI 编码助手。需要 Node.js 18+。

## License

MIT
