WorkRef：`.rsp/changes/long-running-delivery.md`

已完成允许范围内修复：

- `normalizeDeviceId` 仅接受非空 ASCII 十进制字符串，保留前导零并拒绝数值/替代语法。
- 同一 Change 已写入本次测试证据，任务已完成。
- 验证：`mise exec -- pnpm test -- long-running-delivery` 通过，2/2。

当前 canonical status：实现与自动验证完成；Human receiver acceptance 不可用，仍由用户负责，故在此边界停止。未执行 Git 或任何 lifecycle 操作。