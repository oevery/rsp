## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：[设备发现边界](<<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-5kdKLN/docs/architecture/device-discovery-boundary.md>)
- 写入事实：桌面运行时拥有物理发现；中立包仅投影事件；Web 不直接发现硬件；硬件验收不可用且人工负责；自动化测试不等于硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档（Archive ready）：no

验证完成 `npx --no-install rsp check --focused` 与该文档的 `git diff --check`。未重跑测试；本次仅修改架构文档，提供的审查证据显示聚焦测试 2 项通过。未修改 Change、代码或测试，未执行暂存、提交、发布等操作。