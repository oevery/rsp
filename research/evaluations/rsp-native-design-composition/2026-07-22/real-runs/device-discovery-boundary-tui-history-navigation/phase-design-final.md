## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题：已确认，仅解决模块归属、依赖方向与公开接缝。
- 建议：`client/packages/device-discovery` 负责纯事件投影；依赖方向为 desktop raw event → `projectDeviceEvent` → typed immutable event → Web。
- 接缝：公开 `projectDeviceEvent(input)`；修剪 `id`、拒绝空值、冻结返回记录，并原样保留 `connected`。
- 备选方案：在 desktop 或 Web 中归一化均会破坏既定所有权；当前无适配器多实现，不新增抽象接口。
- 证据缺口：仓库仅含 package entry point 与聚焦测试，尚无 desktop/Web 调用方；后续接入必须调用该公开接缝。

已仅更新 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-WZ1tSi/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`npx --no-install rsp check --focused` 通过；仅提示既有 `ADDED` delta marker。未运行实现测试，未进行硬件验收。