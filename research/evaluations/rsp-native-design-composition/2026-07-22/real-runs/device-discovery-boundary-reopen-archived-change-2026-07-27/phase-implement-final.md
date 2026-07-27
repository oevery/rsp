已完成设备发现边界的实现与聚焦测试。

- 修改 `projectDeviceEvent`：修剪 `id`、拒绝空值、返回冻结的新对象，并保留 `connected`。
- 补充测试：输入不变、返回对象不同、`connected: false` 保留。
- 已更新同一 Change 的任务与验证证据。

验证：

`mise exec -- pnpm test -- device-discovery` 通过，3/3。

未完成项：

- 固定范围只读审查尚未执行。
- 接收器硬件验收不可用，仍由人工负责；未声称硬件验收通过。
- 未执行暂存、提交、推送或其他 Git 生命周期操作。