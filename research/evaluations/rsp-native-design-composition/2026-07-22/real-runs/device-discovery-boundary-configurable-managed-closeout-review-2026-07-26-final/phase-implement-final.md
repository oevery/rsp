已实现运行时中立的设备事件投影：

- `projectDeviceEvent` 会修剪设备 ID、拒绝空 ID，并返回冻结的不可变事件。
- 增加了 `RawDeviceEvent` 与只读 `DeviceEvent` 类型。
- 已从实际结果更新同一 Change 的任务、验证证据与硬件阻塞说明。

验证通过：`mise exec -- pnpm test -- device-discovery`，2 个测试通过。`git diff --check` 也通过。

工作引用（WorkRef）

`device-discovery-boundary`

当前状态

实现与聚焦自动化验证完成；尚未进行只读审查与持久化决策。接收器硬件验收仍不可用且由人工负责。未执行暂存、提交或任何发布操作。