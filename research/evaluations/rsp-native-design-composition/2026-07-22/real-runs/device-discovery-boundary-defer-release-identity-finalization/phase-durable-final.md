已写入 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-pFaJX3/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时中立包仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责；自动化测试不构成硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 可归档（Archive ready）：no

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过（仅提示 Change 中存在 `ADDED` delta marker）。未重新执行测试；硬件验收仍被环境限制。未修改 Change、代码或测试。