已完成 Core 的两轴持久化决策，并仅新增架构文档：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-i3YUNU/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时、Web 与运行时中立包的职责边界。
  - `projectDeviceEvent` 的修剪、拒绝空 ID、冻结新对象契约。
  - 当前仅测试使用该 seam，尚未接入桌面适配器或 Web 生产调用方。
  - 硬件验收不可用且仍由人工负责。
- 决策记录：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档：no

验证：文档已完整复读，并通过空白错误检查。未重跑代码测试，因为本次只改文档；审查提供的最新证据仍为 `mise exec -- pnpm test -- device-discovery` 通过 2 项测试。

未修改 Change、代码、测试或 Git 状态；接收器硬件验收继续保持 `blocked`。