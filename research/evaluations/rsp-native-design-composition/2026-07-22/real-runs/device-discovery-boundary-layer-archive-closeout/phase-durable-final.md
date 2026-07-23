已将稳定架构事实写入 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-m60Zn7/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面、运行时中立包与 Web 的设备发现职责边界。
  - `projectDeviceEvent` 的归一化、空 ID 拒绝与冻结返回值契约。
  - 自动化测试与不可用硬件验收的边界。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无；本次没有需要独立长期保留的困难取舍。
- 可归档（Archive ready）：no

验证通过：`git diff --check` 与 `mise exec -- pnpm test -- device-discovery`（2 通过）。未修改 Change、代码或测试；未创建 ADR。接收器硬件验收仍由人工负责且当前不可用。