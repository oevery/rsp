已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-WZ1tSi/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面端运行时负责物理设备发现。
  - 运行时中立包只投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责。
  - 自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档（Archive ready）：no

已核验文档内容与当前实现、聚焦测试及给定审查结论一致；`git diff --check` 通过。未重跑测试，沿用请求中提供的最新通过证据。接收器硬件验收仍未完成。