已完成选中边界的实现并更新同一 Change。

- 修改：`projectDeviceEvent` 现在修剪 `id`、拒绝空值，并返回新的冻结记录。
- 更新：`.rsp/changes/device-discovery-boundary.md` 已记录实现任务与测试证据；硬件验收仍标明不可用且由人工负责。
- 验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed，0 failed）。
- 未执行：固定范围只读审查、持久化事实路由、接收器硬件验收；未进行暂存、提交、推送或发布。

## RSP 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 授权范围：Change、`client/packages/device-discovery/src/index.ts`、聚焦测试
- 当前状态：partial；代码与自动化验证完成
- 修改文件：`client/packages/device-discovery/src/index.ts`、`.rsp/changes/device-discovery-boundary.md`
- 最新验证：`mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项：接收器硬件验收不可用，归人工所有
- 下一步：在获得相应授权后执行只读固定范围审查与 Core 持久化决策