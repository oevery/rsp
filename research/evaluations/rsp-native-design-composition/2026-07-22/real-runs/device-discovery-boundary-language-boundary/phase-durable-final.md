已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 已写入事实：
  - Desktop 负责硬件发现与连接生命周期；Web 不直接发现硬件。
  - 运行时中立的 `projectDeviceEvent` 负责纯投影、规范化与不可变结果。
  - 硬件验收仍不可用，且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 可归档（Archive ready）：no

已验证文档内容与现有实现一致；未改动 Change、代码或测试。接收器硬件验收仍未执行。