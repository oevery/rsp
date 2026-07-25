同一工作引用（WorkRef）：`device-discovery-boundary`

已确认该 Change 只有一个受限设计问题，并已仅更新其 `## Design`：

- 模块所有者：`client/packages/device-discovery`
- 依赖方向：`desktop runtime -> device-discovery -> Web`
- 接缝：桌面适配器在发布跨边界事件前调用 `projectDeviceEvent`
- 约束：纯、同步、无状态；规范化、拒绝空 ID、冻结输出；硬件验收仍由人工负责

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档。