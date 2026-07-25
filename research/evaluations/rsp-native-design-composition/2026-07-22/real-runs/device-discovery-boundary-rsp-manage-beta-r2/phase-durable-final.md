已写入 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-yTGgHF/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时中立包仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责；自动化测试不构成硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档（Archive ready）：no

已验证文档差异通过 `git diff --check`。未修改 Change、代码或测试，也未执行任何 Git 生命周期操作。

仍有阻塞：审查已确认 `projectDeviceEvent` 尚未接入桌面运行时生产调用，且硬件验收仍不可用。