## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 明确桌面、Web 与运行时中立包的设备发现职责边界。
  - 固化 `projectDeviceEvent` 的规范化、空 ID 拒绝与不可变投影契约。
  - 明确硬件验收仍为人工负责且当前不可用。
- 决策记录：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：
  - 无；实现未引入需单独保留的难逆架构取舍。
- 可归档：no

已仅新增 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-hQS4vp/docs/architecture/device-discovery-boundary.md)。

验证：`mise exec -- pnpm test -- device-discovery` 通过（2/2）；文档差异检查通过。未执行硬件验收，仍不可用。未修改 Change、代码或 Git 状态。