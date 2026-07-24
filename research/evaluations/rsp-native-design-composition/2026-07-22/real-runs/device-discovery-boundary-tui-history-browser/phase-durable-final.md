## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-XcoTDd/docs/architecture/device-discovery-boundary.md:1)
- 写入事实：桌面端硬件所有权、`device-discovery` 的纯投影边界、Web 禁止直接发现硬件，以及验收边界。
- 决策记录（Decision Record）：No Decision Record needed
- 可归档（Archive ready）：no

只新增了该架构文档；未修改 Change、代码或测试。`mise exec -- pnpm test -- device-discovery` 通过（3 passed）；接收器硬件验收仍不可用，且自动化测试不构成硬件验收。