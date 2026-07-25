已写入 [设备发现边界说明](<workspace>/docs/architecture/device-discovery-boundary.md)。

持久化决策：

- 当前事实：更新已获授权的架构说明。
- 决策记录：不需要；未创建 ADR。
- 可归档：否。Change 仍有未完成的审查任务与人工硬件验收阻塞。

验证：聚焦测试通过（2 passed）；`git diff --check` 通过。未验证接收器硬件，自动化测试不构成硬件验收。未修改 Change、代码或现有用户改动。