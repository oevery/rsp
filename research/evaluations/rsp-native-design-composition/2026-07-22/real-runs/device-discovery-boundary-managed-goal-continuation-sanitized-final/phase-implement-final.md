已实现设备发现事件投影边界：

- `projectDeviceEvent` 现在修剪 `id`、拒绝空 `device id`，并返回冻结的新对象。
- 已据实更新同一 Change 的任务、验证记录和硬件验收阻塞项。
- `mise exec -- pnpm test -- device-discovery`：2 个测试全部通过。
- `git diff --check` 通过。

未进行接收器硬件验收；该项仍不可用且由人工负责。未暂存、提交或执行其他 Git 生命周期操作。