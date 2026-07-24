已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-m40EC7/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 要写入的事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时中立包只投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责；自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 要写入的理由：无
- 可归档（Archive ready）：no

验证：已执行文档内容检查与 `git diff --check -- docs/architecture/device-discovery-boundary.md`，通过。未重跑测试；采用请求中提供的最新审查证据（`mise exec -- pnpm test -- device-discovery`：2 passed）。接收器硬件验收仍不可用。未修改 Change、代码或测试，且未执行暂存、提交或发布操作。