已写入 [设备发现边界](<<workspace>/docs/architecture/device-discovery-boundary.md:1>)，仅包含已实现的稳定边界事实与验收限制；未创建 ADR，未修改代码或 Change。

## 持久化决策

- 当前事实更新：更新已授权的架构文档
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时拥有物理发现；运行时中立包只投影事件；Web 不直接发现硬件；硬件验收不可用且人工负责；自动化测试不等于硬件验收
- 决策记录（Decision Record）：不需要
- 决策记录目标：不适用
- 可归档：no

验证：`git diff --check --no-index /dev/null docs/architecture/device-discovery-boundary.md` 通过。  
阻塞：审查中的 P1 仍存在——桌面生产调用链尚未接入 `projectDeviceEvent`；接收器硬件验收仍不可用。