已完成选定的设备发现边界实现与聚焦测试。

- 已修改 `client/packages/device-discovery/src/index.ts`：修剪设备 ID、空 ID 抛出 `TypeError`、返回新建且冻结的只读投影。
- 已修改 `test/device-discovery.test.mjs`：覆盖修剪与冻结、`connected: false` 保留、空 ID 拒绝。
- 已更新 `.rsp/changes/device-discovery-boundary.md`：记录实际测试证据与硬件验收限制。

验证：`mise exec -- pnpm test -- device-discovery` 通过，3/3 测试通过。

当前状态：实现完成，但 Change 尚未完成；固定范围只读审查与持久化决策仍未执行。接收器硬件验收不可用，仍由人工负责。未暂存、提交、推送或执行任何发布操作。