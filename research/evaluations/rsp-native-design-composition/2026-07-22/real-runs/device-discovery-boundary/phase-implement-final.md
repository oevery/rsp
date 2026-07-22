已完成选中的设备发现投影边界。

- `projectDeviceEvent` 现会 trim id、拒绝空 id，并返回冻结的 typed projection。
- 已更新同一 Change 的 Tasks、Verify 和硬件验收限制说明。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2/2）。
- `git diff --check` 通过。

未做硬件验收、review、durable review，以及任何 Git lifecycle 操作。硬件验收仍不可用且由人工持有。