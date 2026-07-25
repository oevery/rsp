已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary-GPYltV/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：创建新的持久化规范（Create a new durable spec）
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时发现硬件；runtime-neutral 包仅投影事件；Web 不直接发现硬件；硬件验收不可用且人工负责；自动化测试不是硬件验收。
- 决策记录（Decision Record）：无需（No Decision Record needed）
- 可归档：no

验证已通过：`mise exec -- pnpm test -- device-discovery`（2/2）与 `git diff --check`。未修改 Change、代码或测试；接收器硬件验收仍未完成。