已实现选定边界：

- `projectDeviceEvent` 现会修剪 `id`、拒绝空值，并返回冻结的不可变投影。
- 已更新同一 Change，记录任务与实测证据。

验证通过：`mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）。`git diff --check` 亦通过。

## RSP 后续

- 工作引用（WorkRef）: `device-discovery-boundary`
- 当前状态: 部分完成；代码与聚焦测试通过。
- 已变更产物: `.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 最新验证: `mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项: 接收器硬件验收不可用，仍由人工负责。
- 下一步: 对固定范围进行只读审查。