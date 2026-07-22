已完成选定边界与聚焦测试。

- 实现：`projectDeviceEvent` 裁剪标识、拒绝空标识、保留连接状态，并返回冻结记录。
- 测试：补充断开状态与不可变性断言。
- 验证：`mise exec -- pnpm test -- device-discovery` 通过，3 项通过、0 项失败。
- Change：已在 `.rsp/changes/device-discovery-boundary.md` 更新任务、测试证据和硬件阻塞状态。

未执行只读审查或持久化路由；接收器硬件验收仍不可用且由人工负责。