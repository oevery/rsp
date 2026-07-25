已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - Desktop runtime 负责物理设备发现。
  - runtime-neutral package 仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责；自动化测试不构成硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无
- 可归档（Archive ready）：no

验证：`git diff --check` 通过；`mise exec -- pnpm test -- device-discovery` 通过（2/2）。未进行硬件验收；未修改 Change、代码或测试，未执行任何 Git 生命周期操作。