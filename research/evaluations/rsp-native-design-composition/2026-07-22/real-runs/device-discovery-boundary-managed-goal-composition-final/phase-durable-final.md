已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新已有范围化架构说明
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时负责物理发现；中立包只投影事件；Web 不直连硬件发现；硬件验收不可用且由人工负责；自动化测试不是硬件验收。
- 决策记录（Decision Record）：无需
- 可归档（Archive ready）：否

已验证文档内容与空白格式。`rsp check --focused` 通过；但 Change 仍有未完成任务、硬件验收阻塞，未修改 Change、代码或测试。