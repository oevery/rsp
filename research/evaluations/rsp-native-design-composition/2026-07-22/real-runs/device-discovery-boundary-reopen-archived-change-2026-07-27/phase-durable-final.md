已写入稳定架构事实：[device-discovery-boundary.md](<workspace>/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新已授权的 scoped architecture document
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：无需创建
- 可归档（Archive ready）：no；接收器硬件验收仍不可用且由人工负责

文档明确了桌面运行时硬件发现所有权、运行时中立包仅投影事件、Web 不直连发现硬件，以及自动化测试不构成硬件验收。

验证：`mise exec -- pnpm test -- device-discovery` 通过（3 项）；`git diff --check` 通过。未进行硬件验收。