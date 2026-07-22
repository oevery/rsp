已完成所选边界实现。

- 修改 `projectDeviceEvent`：修剪设备 ID、拒绝空 ID，并返回冻结的只读投影。
- 更新同一 Change 的设计、任务、验证证据和硬件阻塞事实。
- 验证通过：`mise exec -- pnpm test -- device-discovery`，2/2 通过。
- 未执行硬件验收：接收器硬件不可用，仍由人工负责。
- 未执行 review、持久化决策、暂存、提交、推送或发布。