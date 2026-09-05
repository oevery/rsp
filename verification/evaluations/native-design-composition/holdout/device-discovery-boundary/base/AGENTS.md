# Fixture rules

- 人看的输出使用简体中文；命令、路径、WorkRef 和 canonical status 保持原样。
- 先读 `client/AGENTS.md`、`client/CONTEXT.md` 和选中的 Change。
- 设计阶段只能更新同一 Change 的 `## Design`；不得提前实现或创建 durable 文档。
- 实现阶段必须重读 Change，只能修改 Change、runtime-neutral package 和聚焦测试。
- Review 必须只读。Core 仅在明确授权的 durable 阶段写 `docs/architecture/device-discovery-boundary.md`。
- 接收器硬件不可用；不得声称硬件验收通过，不得 commit、push、deploy 或继续其他 Git lifecycle。
- RSP CLI 只允许使用 exact project-local package：`npx --no-install rsp`。禁止 registry、`npx -y @oevery/rsp` 和全局 `rsp`。
- Skill 只从项目 `.agents/skills/` 读取；禁止读取全局 skill 或 memory。
