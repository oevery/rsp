已完成边界实现：

- `projectDeviceEvent` 现会修剪设备 ID、拒绝空 ID，并返回冻结的 `{ id, connected }` 投影。
- 同一 Change 已更新已完成任务与自动化验证证据。
- 未修改桌面/Web 接入、硬件生命周期或其他范围。

验证通过：

`mise exec -- pnpm test -- device-discovery`：2 项通过。

未验证：接收器硬件验收仍不可用，且由人工负责。未暂存、提交、推送或执行其他 Git 生命周期操作。

## RSP 后续

- 工作引用（WorkRef）: `device-discovery-boundary`
- 当前状态: partial；实现与聚焦测试已完成
- 已改文件: `client/packages/device-discovery/src/index.ts`、`.rsp/changes/device-discovery-boundary.md`
- 新鲜验证: `mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项: 接收器硬件验收不可用，由人工负责
- 下一步: 对该固定范围执行只读审查，并由 Core 决定持久化事实路由