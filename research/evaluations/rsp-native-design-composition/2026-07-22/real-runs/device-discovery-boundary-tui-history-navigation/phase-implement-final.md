已实现选定边界：

- `projectDeviceEvent` 现会裁剪设备 ID、拒绝空 ID，并返回冻结的只读事件。
- 已更新同一 Change 的任务、测试证据和硬件阻塞状态。

验证：

- `mise exec -- pnpm test -- device-discovery`：2/2 通过。
- `git diff --check`：通过。

未执行硬件验收；接收器硬件仍不可用且由人工负责。未暂存、提交或执行任何发布操作。