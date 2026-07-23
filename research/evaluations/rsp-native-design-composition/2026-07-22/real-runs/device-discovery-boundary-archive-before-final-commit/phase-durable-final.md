已创建 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-aNT6hK/docs/architecture/device-discovery-boundary.md)，仅记录已实现的所有权、纯投影接缝、依赖方向与硬件验证边界。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面拥有物理发现与连接生命周期；Web 仅展示投影。
  - `projectDeviceEvent` 是修剪、空 ID 拒绝及冻结类型化投影的运行时中立接缝。
  - 硬件验收仍为 unavailable，且人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - none
- 可归档（Archive ready）：no

验证：新文档已完成空白检查；请求中提供的聚焦测试为通过。未重新执行硬件验收，仍不可用。未修改 Change、代码或测试，未执行任何 Git 生命周期操作。