## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题：已确认，只涉及模块归属、依赖方向与 seam，且设计回写至同一 Change。
- 建议：`client/packages/device-discovery` 拥有纯事件投影；desktop 保留硬件发现与连接生命周期；Web 仅消费不可变的类型化投影。
- seam：保留单个纯函数 `projectDeviceEvent(input)`，负责 ID 修剪、空值拒绝、`connected` 保留与冻结结果；不承担设备 I/O、重试、连接状态或 UI。
- 已修改：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-O4kdEk/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未修改其他区段。
- 已验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未运行测试或硬件验收；本阶段不实现行为，接收器硬件仍不可用。