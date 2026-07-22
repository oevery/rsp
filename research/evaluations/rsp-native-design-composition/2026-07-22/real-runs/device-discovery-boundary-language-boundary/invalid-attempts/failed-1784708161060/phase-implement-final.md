已完成选定边界实现。

- `projectDeviceEvent` 现在会 trim `id`、拒绝空 id，并返回冻结的投影对象。
- 同一 Change 已更新任务状态和实测验证证据。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2 passed）。
- 未执行硬件验收；接收器硬件仍不可用且由人工负责。
- 未执行 review、durable review、stage、commit、push 或其他 Git 生命周期操作。