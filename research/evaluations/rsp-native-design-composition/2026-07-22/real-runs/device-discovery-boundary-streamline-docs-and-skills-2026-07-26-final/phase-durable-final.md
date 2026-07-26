已写入稳定架构事实：[device-discovery-boundary.md](<workspace>/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新获授权的 scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：不需要
- 可归档（Archive ready）：no；Change 仍有未完成的审查、Core 路由和人工硬件验收项。

文档明确记录桌面运行时、运行时中立包、Web 与人工硬件验收的边界，并说明自动化测试不构成硬件验收。

验证：`git diff --check` 通过。未重跑测试；采用请求中提供的最新审查证据（`mise exec -- pnpm test -- device-discovery`，2/2 通过）。未修改 Change、代码或测试，未执行暂存、提交、发布等 Git 生命周期操作。