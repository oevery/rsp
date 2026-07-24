已完成持久化架构写入：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-lyrWtO/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理设备发现与连接生命周期。
  - 运行时中立包仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用，仍由人工负责。
  - 自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无；当前内容是稳定边界事实，不需要额外记录取舍。
- 可归档（Archive ready）：no

已验证该文档的 `git diff --check` 通过。未修改 Change、代码或测试；接收器硬件验收仍未覆盖。