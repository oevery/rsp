已实现 `projectDeviceEvent`：修剪设备 ID、拒绝空 ID，并返回冻结的不可变投影。

- 变更文件：`client/packages/device-discovery/src/index.ts`、`.rsp/changes/device-discovery-boundary.md`
- 验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed，0 failed）
- 未验证：接收器硬件验收仍不可用，由人工负责
- 未完成：固定范围只读审查与 Core 持久化决策未执行
- 未执行：暂存、提交、推送、部署或发布