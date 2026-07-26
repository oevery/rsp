已完成所选边界实现。

- `projectDeviceEvent` 现会裁剪设备标识、拒绝空标识，并返回冻结的新投影对象。
- 已更新同一 Change 的任务、验证证据与硬件阻塞状态：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md)。
- 验证通过：`mise exec -- pnpm test -- device-discovery`，2 个测试通过。
- 未进行硬件验收；接收器硬件仍不可用且由人工负责。
- 未执行暂存、提交、推送、发布或其他 Git 生命周期操作。