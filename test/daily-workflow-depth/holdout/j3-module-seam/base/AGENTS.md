# Fixture rules

- 人看的输出使用简体中文；命令、路径、WorkRef 和 canonical status 保持原样。
- 先读 `client/AGENTS.md`、`client/CONTEXT.md` 和选中的 Change。
- 可修改范围只有 Change 声明的三个文件。不得 commit、push、deploy 或声称硬件验收通过。
- `codebase-design` 是项目选择的设计能力；返回同一 WorkRef 后由 `rsp-implement` 执行。
- RSP CLI 只允许使用本项目安装的 exact local package：`npx --no-install rsp`。不得使用 `npx -y @oevery/rsp`、全局 `rsp` 或其他会访问 registry 的变体。
- Skill 只从本项目 `.agents/skills/` 读取；不得读取 `~/.agents/skills`、`~/.codex/skills`、`~/.codex/memories` 或用全局 skill/memory 取代已安装 skill。
