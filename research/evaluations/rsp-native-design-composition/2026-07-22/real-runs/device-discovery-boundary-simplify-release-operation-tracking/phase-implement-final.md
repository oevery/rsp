已实现设备发现投影边界并更新同一 Change。

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值、保留连接状态，并返回冻结的新对象。
- 已更新 `.rsp/changes/device-discovery-boundary.md`：完成设计和实现任务，记录测试证据及硬件验收阻塞。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）。
- 未执行硬件验收、固定范围审查或持久化事实审查；接收器硬件仍不可用且由人工负责。
- 未暂存、提交、推送或执行其他 Git 生命周期操作。

## 后续状态

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：部分完成；自动化边界验证通过。
- 已改动工件：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 新鲜验证：`mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项：接收器硬件验收不可用，负责人为人工。
- 下一步：由授权人员进行只读固定范围审查；硬件可用后完成人工验收。