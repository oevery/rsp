已完成所选边界实现并更新同一 Change。

- 修改：`projectDeviceEvent` 现会修剪 `id`、拒绝空 `id`，并返回冻结的 `DeviceEvent` 投影。
- 更新：`.rsp/changes/device-discovery-boundary.md` 已记录完成的设计与实现任务、测试证据及硬件阻塞。
- 验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed, 0 failed）。
- 未验证：接收器硬件验收仍不可用，且由人工负责。
- 未执行：review、持久化事实审查、暂存、提交、推送、发布或部署。

## 后续状态

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：实现与聚焦自动化验证完成；硬件验收阻塞。
- 下一步：由人工完成接收器硬件验收；随后在授权范围内进行只读审查与持久化审查。