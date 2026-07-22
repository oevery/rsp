已完成运行时中立的设备事件投影边界。

- `projectDeviceEvent` 现在会 trim `id`、拒绝空值，并返回冻结的新对象。
- 已更新同一 Change 的任务、验证证据与硬件阻塞说明。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2/2）。

未执行只读审查与持久化决策；接收器硬件验收仍不可用且由人工负责。未进行暂存、提交或发布。