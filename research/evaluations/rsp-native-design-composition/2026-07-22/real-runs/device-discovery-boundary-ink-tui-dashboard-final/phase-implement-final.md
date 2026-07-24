已完成选中边界实现。

- `projectDeviceEvent` 现会裁剪设备 ID、拒绝空 ID，并返回冻结的 `{ id, connected }` 投影。
- 已更新同一 Change 的任务与验证证据：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-kcADaO/.rsp/changes/device-discovery-boundary.md)
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）。
- 未执行接收器硬件验收；该项仍不可用且由人工负责。
- 尚未执行只读审查或持久化事实路由；它们仍保留在 Change 的未完成任务中。
- 未暂存、提交、推送或执行其他 Git 生命周期操作。