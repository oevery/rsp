已写入稳定架构边界：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-iZpX7M/docs/architecture/device-discovery-boundary.md)。

包含四项当前事实，并明确自动化测试不构成硬件验收。未修改 Change、代码或测试；未创建 ADR。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录：No Decision Record needed
- 可归档：no（接收器硬件验收仍不可用且由人工负责）

验证：新文件的空白检查无错误。先前提供的聚焦测试证据为 `mise exec -- pnpm test -- device-discovery`，2 项通过；不代表硬件验收。