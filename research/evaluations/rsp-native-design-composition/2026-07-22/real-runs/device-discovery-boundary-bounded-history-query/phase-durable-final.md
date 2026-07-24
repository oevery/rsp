已完成 Core 持久化决策，仅新增 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-V4VgUR/docs/architecture/device-discovery-boundary.md)。

文档明确记录了职责边界、依赖方向、`projectDeviceEvent` 的稳定行为，以及：自动化测试不是硬件验收，接收器硬件验收仍不可用且由人工负责。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面、runtime-neutral package 与 Web 的设备发现职责及依赖方向。
  - 投影接口的同步、纯函数、规范化与不可变约束。
  - 自动化测试与硬件验收的明确边界。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无；本次没有需要单独长期保留的不可逆权衡。
- 可归档（Archive ready）：no

验证已通过：`mise exec -- pnpm test -- device-discovery`（2 passed）和 `git diff --check`。未执行硬件验收；该验收仍不可用。