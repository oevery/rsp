已完成纯投影边界实现。

- 修改 `projectDeviceEvent`：修剪 `id`、拒绝空值、返回冻结对象。
- 更新同一 Change 的任务、验证证据与硬件验收阻塞说明。
- 未改动既有聚焦测试，未执行审查、归档或 Git 操作。

验证：

- `mise exec -- pnpm test -- device-discovery`：通过，2 项测试通过。
- `git diff --check`：通过。

工作引用（WorkRef）

- `device-discovery-boundary`

当前状态

- 实现与聚焦自动化验证已完成；Change 仍待固定范围只读审查、持久化决策，以及由人工在可用接收器硬件上完成验收。

阻塞项

- 接收器硬件验收不可用，且由人工负责。