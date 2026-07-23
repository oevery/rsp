## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：确定设备发现事件投影的模块归属、依赖方向与接口缝。
- 已更新：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LNm6ZH/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，仅此文件与区段。

结论：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent` 投影；依赖方向为桌面适配器 → runtime-neutral 包 → Web。函数负责 trim、空 ID 拒绝与不可变记录创建；不承担硬件、连接生命周期或事件路由。

已验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。

未验证：接收器硬件验收仍不可用且由人工负责；当前 fixture 没有桌面/Web 实际消费者，后续集成需遵守该方向。未修改代码、测试、文档、Tasks、Verify 或 Blockers。