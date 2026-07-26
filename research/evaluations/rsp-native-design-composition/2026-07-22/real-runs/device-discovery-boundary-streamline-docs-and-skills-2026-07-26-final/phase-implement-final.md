已完成设备发现边界实现。

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值，并返回冻结的只读记录。
- 已更新同一 Change 的任务与验证证据。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2/2）。
- 未执行固定范围审查或持久化决策；接收器硬件验收仍不可用且由人工负责。
- 未暂存、提交或执行任何发布操作。