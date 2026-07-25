已完成所选边界实现。

- `projectDeviceEvent` 现在会修剪 `id`、拒绝空值，并返回冻结的不可变投影：[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-4OJuSY/client/packages/device-discovery/src/index.ts)
- 已在同一 Change 中更新完成任务与实测证据：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-4OJuSY/.rsp/changes/device-discovery-boundary.md)
- 验证通过：`mise exec -- pnpm test -- device-discovery`，2/2 通过。
- `git diff --check` 通过。

当前仍未完成固定范围审查、持久化审查和接收器硬件验收；硬件不可用，仍由人工负责。未暂存、提交、推送或执行其他 Git 生命周期操作。