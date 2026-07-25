工作引用（WorkRef）：`device-discovery-boundary`

已确认这是一个有界的单一模块设计问题，设计结论已回写同一 Change 的 `## Design`。

已明确：

- 所有者：`client/packages/device-discovery`
- 依赖方向：`desktop adapter -> device-discovery package -> Web presentation`
- 接缝：纯函数 `projectDeviceEvent(input)`，负责规范化、空 ID 拒绝和冻结不可变输出
- 非目标：设备发现、连接生命周期、订阅与 UI 决策

仅修改了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。未修改代码、测试、Tasks、Verify、Blockers 或持久化架构文档；硬件验收仍不可用。