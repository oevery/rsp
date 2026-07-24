## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：Change 只含一个有界设计问题，设计结论已回写至同一 WorkRef 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 负责纯事件投影。
- 依赖方向：desktop adapter → `client/packages/device-discovery` → typed consumers；Web 仅消费投影，不能发现或访问硬件。
- seam：导出的 `projectDeviceEvent`；负责规范化、空 ID 拒绝、不可变新对象，不承载硬件、连接生命周期或 Web 行为。
- 已修改：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-iZpX7M/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未修改其他区块或任何代码、测试、架构文档。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未运行实现测试；接收器硬件验收仍不可用。

下一步：在同一 `device-discovery-boundary` 中实施投影与聚焦测试。