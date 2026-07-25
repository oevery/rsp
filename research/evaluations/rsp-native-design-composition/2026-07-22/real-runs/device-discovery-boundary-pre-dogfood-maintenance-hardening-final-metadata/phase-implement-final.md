已完成选定边界实现。

- 更新 `projectDeviceEvent`：修剪 ID、拒绝空 ID、冻结返回对象，并保持 `connected` 原值。
- 更新同一 Change 的任务与验证记录：`.rsp/changes/device-discovery-boundary.md`
- 验证：`mise exec -- pnpm test -- device-discovery` 通过，2 项测试全部通过。
- 未执行硬件验收；接收器硬件仍不可用且由人工负责。
- 尚未执行只读审查或持久化事实审查；未暂存、提交或发布。

工作引用（WorkRef）：`device-discovery-boundary`  
当前状态：实现完成，等待审查与人工硬件验收。