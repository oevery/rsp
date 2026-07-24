已实现所选边界：

- `projectDeviceEvent` 现在会修剪 id、拒绝空 id，并返回冻结的只读投影。
- 已更新同一 Change，记录完成项、测试证据与硬件验收阻塞。

验证：

- `mise exec -- pnpm test -- device-discovery`：通过，2/2。
- 未执行硬件验收；接收器不可用，仍由人工负责。
- 未执行固定范围审查或持久化决策，故 Change 尚未完成。
- 未暂存、提交、推送或发布。