已实现并记录同一 Change：

- `projectDeviceEvent` 现在修剪 ID、拒绝空 ID，并返回新的冻结只读记录。
- 聚焦测试补充了非别名、`connected: false` 保留等断言。
- 已更新 `.rsp/changes/device-discovery-boundary.md` 的任务和测试证据。

验证通过：`mise exec -- pnpm test -- device-discovery`（3 passed, 0 failed）。`git diff --check` 通过。

未完成：固定范围只读审查、持久化事实决策，以及接收器硬件验收；硬件仍不可用且由人工负责。未执行暂存、提交、推送或发布。