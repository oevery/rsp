## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：该 Change 仅包含一个有界设计问题，且设计结论已回写同一 WorkRef。
- 模块归属：`client/packages/device-discovery` 负责纯 `projectDeviceEvent` 投影。
- 依赖方向：desktop 可依赖该包；该包不得依赖 desktop 或 Web；Web 只能消费已投影事件。
- 模块接缝（seam）：公开的 `projectDeviceEvent(input)`，负责修剪并校验 `id`、保留 `connected`、返回冻结的新记录；连接生命周期、重试和设备状态仍归 desktop。
- 已修改：仅 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-x5JsLQ/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未执行：未运行测试、未进行硬件验收；硬件仍不可用。