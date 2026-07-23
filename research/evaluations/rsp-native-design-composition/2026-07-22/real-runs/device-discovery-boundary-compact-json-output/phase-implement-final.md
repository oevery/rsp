已实现选中边界：

- `projectDeviceEvent` 现会修剪 id、拒绝空 id，并返回冻结的不可变事件对象。
- 已更新同一 Change 的任务、验证证据与硬件验收阻塞说明：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-FqGMXY/.rsp/changes/device-discovery-boundary.md)
- 实现位于：[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-FqGMXY/client/packages/device-discovery/src/index.ts)

验证已执行并通过：`mise exec -- pnpm test -- device-discovery`（2/2 通过）。

未执行硬件验收；接收器硬件仍不可用且由人工负责。未暂存、提交或发布。