已仅新增稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-FqGMXY/docs/architecture/device-discovery-boundary.md)。

- `mise exec -- pnpm test -- device-discovery`：2 项通过。
- `git diff --check -- docs/architecture/device-discovery-boundary.md`：通过。
- 未修改 Change、代码、测试或决策记录；未执行任何 Git 生命周期操作。
- 接收器硬件验收仍由人工负责且不可用。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面端拥有物理发现和连接生命周期；Web 只消费投影。
  - 运行时中立包归一化并冻结设备事件，拒绝空白标识。
  - 当前无可追踪桌面适配器实现，硬件验收不可由自动化测试替代。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无
- 可归档（Archive ready）：no