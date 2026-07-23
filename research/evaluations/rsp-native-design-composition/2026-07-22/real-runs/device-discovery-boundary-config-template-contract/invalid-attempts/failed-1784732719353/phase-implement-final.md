已完成运行时中立的设备事件投影实现，并如实更新同一 Change。

- `projectDeviceEvent` 现在修剪 `id`、拒绝空值，并返回冻结的不可变投影。
- 更新了 `.rsp/changes/device-discovery-boundary.md` 的任务、测试证据与硬件验收阻塞项。
- 聚焦测试已通过：`mise exec -- pnpm test -- device-discovery`（2/2）。

未验证接收器硬件；该验收仍不可用且由人工负责。固定范围审查与持久化审查任务仍未执行。未暂存、提交或发布任何内容。

## RSP 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：部分完成；自动化验证通过，硬件验收待人工完成
- 已变更产物：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 最新验证：`mise exec -- pnpm test -- device-discovery`，通过（2 项）
- 阻塞项：接收器硬件验收不可用，由人工负责
- 下一步：进行只读固定范围审查，并在授权后完成持久化审查