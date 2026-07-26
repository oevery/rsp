已完成选定边界实现：

- `projectDeviceEvent` 现在会去除 `id` 空白、拒绝空值、保留 `connected`，并返回冻结对象。
- 聚焦测试覆盖规范化与不可变性、断开状态、空标识拒绝。
- 已更新同一 Change 的任务、验证证据与硬件阻塞说明：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md)

验证已通过：`mise exec -- pnpm test -- device-discovery`，3 项通过。`git diff --check` 无输出。

未执行硬件验收；接收器硬件仍不可用且由人工负责。未进行 review、持久化决策、暂存、提交或任何发布操作。