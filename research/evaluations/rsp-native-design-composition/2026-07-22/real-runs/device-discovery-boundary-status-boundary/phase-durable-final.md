## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面、运行时中立投影、Web 的设备发现职责边界。
  - `projectDeviceEvent` 的规范化、不可变结果与非职责范围。
  - 硬件验收仍不可用且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：
  - 无；本次没有需要长期保留的不可逆取舍。
- 可归档（Archive ready）：no

已仅新增 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-QwDmHa/docs/architecture/device-discovery-boundary.md)。

验证通过：`git diff --check`、`mise exec -- pnpm test -- device-discovery`（2 通过）。未进行硬件验收；该项仍由人工负责。