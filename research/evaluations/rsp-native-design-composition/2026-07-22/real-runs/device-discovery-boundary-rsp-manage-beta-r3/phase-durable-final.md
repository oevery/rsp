已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-izMjVG/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时中立包只投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责；自动化测试不构成硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

已验证新增文档内容及 `git diff --check`。未重跑测试；本请求提供的最新审查证据为 `mise exec -- pnpm test -- device-discovery` 通过 2 项。未修改 Change、代码或测试，也未执行 Git 生命周期操作。