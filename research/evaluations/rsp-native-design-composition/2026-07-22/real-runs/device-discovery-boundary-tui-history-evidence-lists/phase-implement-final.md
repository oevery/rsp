已完成设备发现边界实现。

- `projectDeviceEvent` 现在会修剪 id、拒绝空 id，并返回冻结的新事件对象。
- 已更新同一 Change 的任务与验证证据：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-j5nwYf/.rsp/changes/device-discovery-boundary.md)
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2/2）。
- 接收器硬件验收仍不可用，且由人工负责；固定范围审查与持久化决策任务尚未执行。
- 未暂存、提交、推送或执行其他 Git 生命周期操作。