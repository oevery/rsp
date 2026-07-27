已实现设备发现投影边界：

- `projectDeviceEvent` 现会修剪设备 ID、拒绝空 ID，并返回冻结对象。
- 已更新同一 Change 的任务、验证证据和硬件验收阻塞说明。

验证已通过：

`mise exec -- pnpm test -- device-discovery`：2/2 通过。

未执行接收器硬件验收；该项仍由人工负责。未进行暂存、提交或其他 Git 生命周期操作。