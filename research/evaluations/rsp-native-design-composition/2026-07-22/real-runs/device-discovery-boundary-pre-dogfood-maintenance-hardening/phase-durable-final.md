已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时拥有物理发现；运行时中立包只投影设备事件；Web 不直接发现硬件；硬件验收不可用且由人工负责；自动化测试不构成硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档（Archive ready）：no

验证：已检查文档内容与空白错误。未运行测试（仅文档变更）。

未写入“桌面事件发布边界已接入投影函数”：现有审查证据显示该生产接缝仍缺失。