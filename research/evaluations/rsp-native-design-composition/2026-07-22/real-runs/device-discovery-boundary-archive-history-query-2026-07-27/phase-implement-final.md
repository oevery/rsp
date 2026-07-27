已完成选定边界的实现与记录更新。

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值，并返回不可变的 `DeviceEvent`。
- 已更新同一 Change 的任务、测试证据与硬件验收阻塞说明：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md)
- 已验证：`mise exec -- pnpm test -- device-discovery`，2/2 通过。
- 未验证：接收器硬件验收仍不可用，且由人工负责。
- 未执行暂存、提交、推送、部署或发布。