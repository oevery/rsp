已完成 `device-discovery-boundary` 的有界设计，并回写同一 WorkRef。

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：`client/packages/device-discovery` 拥有纯事件投影；依赖方向为 desktop → runtime-neutral → Web；seam 为 `projectDeviceEvent(input)`。
- 修改：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-QwDmHa/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未改动其他区域。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件验收不可用，且未执行实现或测试。
- 下一步：在同一 WorkRef 中实现 `projectDeviceEvent` 与聚焦测试。