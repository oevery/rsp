## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录：No Decision Record needed
- 可归档：no

已仅新增 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-HG6zej/docs/architecture/device-discovery-boundary.md)，明确四项稳定边界及“自动化测试不构成硬件验收”。

验证：`git diff --check` 通过。未重跑测试；采用请求中提供的 `mise exec -- pnpm test -- device-discovery`（2 passed）作为新鲜证据。接收器硬件验收仍不可用且由人工负责，因此不可归档。