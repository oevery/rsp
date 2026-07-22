已实现所选边界：

- `projectDeviceEvent` 现在 trim `id`、拒绝空 id，并返回冻结的不可变投影。
- 同一 Change 已更新任务、测试证据和硬件阻塞说明：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-vITKzt/.rsp/changes/device-discovery-boundary.md)
- 实现位于：[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-vITKzt/client/packages/device-discovery/src/index.ts)

验证通过：`mise exec -- pnpm test -- device-discovery`，2 passed。

未执行硬件验收；接收器硬件仍不可用且由人工负责。未 stage、commit、push 或进行其他 Git 生命周期操作。