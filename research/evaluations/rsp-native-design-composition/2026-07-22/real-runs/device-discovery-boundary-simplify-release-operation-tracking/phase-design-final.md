## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：已确认是一个有界问题——设备事件投影的模块归属、依赖方向与接缝。
- 建议：`client/packages/device-discovery` 拥有纯投影；Desktop 发现硬件并调用它；Web 仅消费投影结果。
- 接缝：`projectDeviceEvent` 负责修剪并校验 `id`、保留 `connected`、返回冻结对象；不接触硬件。
- 取舍：未将规范化放入 Desktop 或 Web，以避免运行时细节泄漏或让展示层承担硬件输入职责；不新增无实际变化点的适配器接口。
- 证据缺口：该 fixture 没有 Desktop/Web 的真实调用路径，硬件验收仍不可用且由人工负责。

## 变更与验证

- 已修改：仅同一工作引用的 [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-kOJkYY/.rsp/changes/device-discovery-boundary.md:15) 中 `## Design`。
- 已验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未运行：测试未运行，因为本阶段未改代码或测试；硬件验收不可用。
- 下一步：由同一 `device-discovery-boundary` 实施投影函数及其聚焦测试。