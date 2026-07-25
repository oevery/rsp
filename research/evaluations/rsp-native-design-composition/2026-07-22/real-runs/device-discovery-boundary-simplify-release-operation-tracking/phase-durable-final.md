已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-kOJkYY/docs/architecture/device-discovery-boundary.md)。

验证通过：`mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）和 `git diff --check`。自动化测试不构成接收器硬件验收；该验收仍不可用且由人工负责。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时无关包只投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责。
  - 自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无
- 可归档（Archive ready）：no

未修改 Change、代码或测试；未执行暂存、提交、推送、合并、变基、部署或发布。