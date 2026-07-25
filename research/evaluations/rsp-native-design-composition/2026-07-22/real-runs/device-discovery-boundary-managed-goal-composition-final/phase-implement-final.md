已完成选定边界实现：

- `projectDeviceEvent` 现在会 trim `id`、拒绝空值，并返回冻结的不可变投影。
- 同一 Change 已记录实际测试证据及硬件验收阻塞：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-sRrM64/.rsp/changes/device-discovery-boundary.md)
- 实现位于：[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-sRrM64/client/packages/device-discovery/src/index.ts)

验证已执行并通过：

`mise exec -- pnpm test -- device-discovery`：2 passed，0 failed。

未执行硬件验收；接收器硬件仍不可用且由人工负责。Change 还保留固定范围审查与持久化决策两个未完成任务。未暂存、提交、推送或发布。