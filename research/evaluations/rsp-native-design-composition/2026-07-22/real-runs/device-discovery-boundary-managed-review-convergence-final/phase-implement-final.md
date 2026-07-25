## 完成情况

已实现 `projectDeviceEvent`：

- 修剪设备 `id`，空值抛出 device-id 错误。
- 返回新的冻结记录，保留 `connected`。
- 聚焦测试覆盖规范化、不可变性、不同引用与空值拒绝。
- 同一 Change 已更新任务、测试证据和硬件阻塞说明。

## 验证

`mise exec -- pnpm test -- device-discovery`：2 通过，0 失败。

接收器硬件验收仍不可用且由人工负责；固定范围审查与持久化决策尚未执行。未暂存、提交、推送或发布。