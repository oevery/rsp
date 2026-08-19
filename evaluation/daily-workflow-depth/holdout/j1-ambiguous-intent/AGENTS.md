# 项目规则

- 默认使用简体中文与用户沟通。
- 先阅读 `CONTEXT.md`、已选中的 RSP Change，以及相关 RSP skill，再处理工作。
- 用户要求 challenge / 严格追问时使用 `rsp-shape`；一次只追问一个会改变行为、所有权、迁移或验收的 owner decision，并给出基于仓库事实的建议。
- 未获得 owner decision 与共同确认前，不得修改任何文件。
- 不得 commit、push、publish 或 archive。
- RSP CLI 只允许使用隔离项目已安装的 exact local package：`npx --no-install rsp` 或 `./node_modules/.bin/rsp`；不得运行会访问 registry 的 `npx -y @oevery/rsp`。
- 保留 `transition-owner`、`course-transition` 等 canonical identifiers，不翻译标识符。
