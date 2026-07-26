已完成边界实现：

- `projectDeviceEvent` 现在会修剪 `id`、拒绝空值，并返回冻结的不可变投影。
- 已将实际测试证据写回同一 Change：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md)。
- 通过：`mise exec -- pnpm test -- device-discovery`（2/2）。
- 未执行硬件验收：接收器硬件仍不可用，且由人工负责。
- 仍待只读审查与 Core 持久化审查；未暂存、提交、推送或执行其他 Git 生命周期操作。