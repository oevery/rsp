已实现设备事件纯投影边界：

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值，并返回冻结的新对象。
- 已更新同一 Change 的任务、测试证据与硬件验收阻塞说明。
- 已运行 `mise exec -- pnpm test -- device-discovery`：2 通过，0 失败。
- 未进行硬件验收；接收器硬件仍不可用且由人工负责。
- 未暂存、提交或执行其他 Git 生命周期操作。