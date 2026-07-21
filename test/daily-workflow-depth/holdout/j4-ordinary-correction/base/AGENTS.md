# Fixture rules

- 人看的输出使用简体中文；命令、路径、WorkRef 和 canonical status 保持原样。
- RSP CLI 只允许使用隔离项目已安装的 exact local package：`npx --no-install rsp` 或 `./node_modules/.bin/rsp`；不得运行会访问 registry 的 `npx -y @oevery/rsp`。
- Skill 只读取隔离项目 `.agents/skills/` 下由 exact local package 安装的副本；不得读取全局 skill 或 memory 代替项目已安装 Skill。
- 使用选中的 Change，严格先写 focused test，再观察 RED，最后做最小 GREEN。
- 修改后执行 `mise exec -- pnpm test -- cache-isolation`，并 review selected-change diff。
- authenticated acceptance 不可用；不得声称完成该验收，不得 commit、push 或 publish。
