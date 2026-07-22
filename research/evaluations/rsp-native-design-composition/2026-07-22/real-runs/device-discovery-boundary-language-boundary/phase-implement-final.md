已完成选定边界实现。

- 修改 `projectDeviceEvent`：修剪设备 ID、拒绝空 ID、返回冻结的投影对象。
- 更新同一 Change 的任务与验证证据：`.rsp/changes/device-discovery-boundary.md`。
- 验证通过：`mise exec -- pnpm test -- device-discovery`，2 通过、0 失败。
- 未验证：接收器硬件验收仍不可用，保持人工负责。
- 未完成：只读范围审查与 Core 持久化事实决策；未暂存、提交或发布。