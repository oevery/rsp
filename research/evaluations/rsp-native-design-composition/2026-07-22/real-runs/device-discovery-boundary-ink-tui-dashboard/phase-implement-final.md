已完成选定边界的实现。

- 修改：`projectDeviceEvent` 现会修剪 id、拒绝空 id，并返回冻结的只读投影。
- 更新：同一 Change 已勾选设计与实现任务，并写入实测结果。
- 验证：`mise exec -- pnpm test -- device-discovery` 通过（2/2）。
- 未验证：接收器硬件验收仍不可用，归人类负责。
- 未执行：暂存、提交、推送、发布或部署。

## RSP 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：部分完成；实现与聚焦测试完成。
- 变更文件：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 新鲜验证：`mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项：硬件验收不可用，由人类负责
- 下一步：对固定范围执行只读审查，并进行持久化事实决策。