已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-PEKBJh/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录：No Decision Record needed
- 可归档：no

文档明确记录了 Desktop、运行时中立包与 Web 的边界，以及硬件验收仍不可用、人工负责；也明确自动化测试不构成硬件验收。

验证：文档内容复核通过；`git diff --check --no-index` 无空白错误。未重跑测试；请求提供的最新审查证据显示 `mise exec -- pnpm test -- device-discovery` 已通过 2 项。未改动 Change、代码或 Git 生命周期。