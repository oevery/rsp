# 项目规则

- 默认使用简体中文与用户沟通。
- 先阅读 `CONTEXT.md`、相关 Spec、已选中的 RSP Change，以及相关 RSP skill。
- RSP Change 是工作 owner；project-owned `domain-modeling` capability 只分析领域语言，并把 bounded return envelope 返回同一个 WorkRef。
- 未获得用户确认前不得修改项目领域文档、Change 或生产文件。
- 不得创建新的 glossary owner，不得 commit、push 或 publish。
- RSP CLI 只允许使用隔离项目已安装的 exact local package：`npx --no-install rsp` 或 `./node_modules/.bin/rsp`；不得运行会访问 registry 的 `npx -y @oevery/rsp`。
- `ActiveParticipant`、`EnrolledParticipant`、`participant-readiness` 等 canonical identifiers 必须原样保留。
