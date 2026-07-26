已写入 [设备发现边界](<workspace>/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新既有范围说明
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时负责物理发现；中立包仅投影事件；Web 不直接发现硬件；硬件验收不可用且归人工；自动化测试不等同硬件验收。
- 决策记录（Decision Record）：不需要
- 可归档（Archive ready）：no

## 后续状态

- 工作引用（WorkRef）：`device-discovery-boundary`
- 权威依据：`client/AGENTS.md`、`client/CONTEXT.md`、Change、聚焦状态与提供的审查结论。
- 当前状态：稳定架构事实已落盘；桌面适配器尚未接入 `projectDeviceEvent`，硬件验收仍阻塞。
- 改动工件：仅新增该架构文档。
- 最新验证：`rsp check --focused` 通过；新文档已通过 `git diff --check`。
- 阻塞项：接收器硬件验收不可用且人工负责；自动化测试不构成该验收。
- 下一步：明确桌面适配器接入归属并完成后，再执行固定范围复审。