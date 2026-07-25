已完成选定边界实现。

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值，并返回冻结的不可变记录。
- 已更新同一 Change 的任务和测试证据。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2 passed）。

未执行固定范围审查或持久化评审；接收器硬件验收仍不可用，归人工负责。