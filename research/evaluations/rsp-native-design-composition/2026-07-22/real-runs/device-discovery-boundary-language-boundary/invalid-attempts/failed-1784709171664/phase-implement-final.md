已完成选定边界实现并更新同一 Change。

- 修改 `client/packages/device-discovery/src/index.ts`：`projectDeviceEvent` 现在会修剪 ID、拒绝空 ID，并返回冻结的不可变投影。
- 更新 `.rsp/changes/device-discovery-boundary.md`：标记设计与实现任务完成，记录测试证据。
- 验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed，0 failed）。
- 未验证：接收器硬件验收仍不可用，归人类负责。

## RSP 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：partial；实现与聚焦测试完成。
- 变更产物：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 阻塞项：接收器硬件不可用，由人类负责。
- 下一步：在明确授权下进行只读固定范围审查与 Core 持久化决策。