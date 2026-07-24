已完成所选边界的实现与聚焦测试。

- `projectDeviceEvent` 现会裁剪 ID、拒绝空 ID、保留 `connected`，并返回冻结的不可变记录。
- 更新了聚焦测试，覆盖裁剪、不可变性、断开状态与空 ID 拒绝。
- 同一 Change 已写入实际测试证据并勾选已完成任务：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-NNVIvg/.rsp/changes/device-discovery-boundary.md)。

验证已通过：

`mise exec -- pnpm test -- device-discovery`：3 passed，0 failed。

未验证接收器硬件验收；该项仍不可用且由人工负责。Change 仍待固定范围只读审查与持久化事实决策；未执行暂存、提交、推送、部署或发布。