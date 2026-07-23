## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：由 `client/packages/device-discovery` 负责纯事件投影；依赖方向为 desktop adapter → `device-discovery` → Web。
- 接缝：公开 `projectDeviceEvent(input)`，负责修剪并校验 `id`、返回冻结的新记录，原样保留 `connected`。
- 已更新：仅修改同一 Change 的 [`## Design`](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-FqGMXY/.rsp/changes/device-discovery-boundary.md:15)。
- 证据缺口：此夹具没有桌面适配器生产调用方；设计已明确其为预期调用者，未虚构调用链。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未运行行为测试，未进行接收器硬件验收（不可用且由人工负责）。
- 后续动作：在同一 `device-discovery-boundary` 中按已确定接缝实施投影与聚焦测试。