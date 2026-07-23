## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 已写入事实：
  - 明确桌面运行时、运行时中立边界包与 Web 的职责及依赖方向。
  - 固化 `projectDeviceEvent` 的同步、无状态、规范化、不可变投影与空标识拒绝契约。
  - 明确包不得打开设备或管理生命周期，Web 不得直接发现硬件。
  - 保留硬件验收不可用且不由自动化测试替代的边界。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：无
- 可归档（Archive ready）：no

已仅新增 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-bVZlVl/docs/architecture/device-discovery-boundary.md)。

验证了该文件的工作树状态；未重跑测试，采用请求中提供的最新审查证据（`mise exec -- pnpm test -- device-discovery`：2 passed）。接收器硬件验收仍不可用。未修改 Change、代码或测试，未执行暂存、提交或发布操作。