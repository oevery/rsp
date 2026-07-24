## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认该 Change 只有一个有界设计问题，且结论已回写同一 WorkRef 的 `## Design`。
- 模块所有者：`client/packages/device-discovery` 仅拥有纯事件投影；desktop 保留硬件发现与连接生命周期。
- 依赖方向：desktop 原始事件 → `projectDeviceEvent` → Web/其他运行时中立消费者。
- 边界（seam）：`projectDeviceEvent` 负责修剪 ID、拒绝空 ID、保留连接状态并返回冻结记录；不含 I/O、订阅或生命周期策略。
- 已比较并排除在 desktop 或 Web 放置标准化逻辑的方案。
- 已修改：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-epgO47/.rsp/changes/device-discovery-boundary.md)

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未运行硬件验收，接收器硬件仍不可用。