已完成选中边界与聚焦测试。

- `projectDeviceEvent` 现在修剪 `id`、拒绝空白 ID，并返回新的冻结只读事件对象。
- 聚焦测试补充了新对象身份与 `connected: false` 保留。
- 同一 Change 已记录设计、实现任务及测试实证。

验证：`mise exec -- pnpm test -- device-discovery` 通过，3/3 测试通过。

未验证：接收器硬件验收仍不可用且由人工负责；Change 中的只读审查与 durable review 仍未完成。未执行暂存、提交、推送或发布。

## RSP Continuation

- WorkRef: `device-discovery-boundary`
- Authority: `.rsp/changes/device-discovery-boundary.md`
- Current state: partial；实现与聚焦测试完成，后续审查和 durable review 未完成
- Changed artifacts: `.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`、`test/device-discovery.test.mjs`
- Fresh verification: `mise exec -- pnpm test -- device-discovery` 通过（3 tests passed）
- Blockers: Receiver hardware acceptance unavailable; human owned
- Next action: 对该固定范围执行只读审查