已写入架构事实：[device-discovery-boundary.md](<workspace>/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新已授权的架构文档。
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：不需要；这是已实现边界的稳定事实，没有需单独保留的不可逆取舍。
- 可归档（Archive ready）：否；接收器硬件验收仍不可用且由人工负责。

文档明确写入了桌面运行时发现责任、运行时中立包仅作事件投影、Web 不直接发现硬件、人工硬件验收未完成，以及自动化测试不等同于硬件验收。

验证：已检查文档内容并通过 `git diff --check`。未重跑测试；未修改 Change、代码或创建 ADR；未执行任何 Git 生命周期操作。