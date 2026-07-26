## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：运行时中立的设备事件投影应由谁拥有、依赖如何单向流动、边界放在哪里。
- 建议：桌面运行时拥有物理发现与连接生命周期；`client/packages/device-discovery` 只拥有纯粹、无状态的 `projectDeviceEvent` 投影；Web 仅消费投影结果。
- 依赖方向：桌面适配器 → 运行时中立投影 → Web 展示/测试。
- 边界：`projectDeviceEvent` 接收原始记录，修剪并校验 `id`，返回新的不可变投影；不订阅、不连设备、不保存连接状态。

仅更新了同一变更的 `## Design`：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15)。

验证完成：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未运行实现测试，也未声称硬件验收。