## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：该 Change 只有一个有界设计问题，且设计结论已回写到同一 WorkRef 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 负责运行时中立的事件投影；Desktop 保留硬件发现与连接生命周期所有权。
- 依赖方向：Desktop 原始事件 → `device-discovery` 投影 → Web 展示；禁止反向依赖或由 Web 归一化。
- 接缝：保留一个纯函数 `projectDeviceEvent(input)`，负责修剪、空值拒绝、布尔值保留及不可变输出；不承担设备 I/O。
- 已比较替代方案：Desktop 或 Web 内归一化会破坏边界；新增 provider/adapter 接口属于无实际收益的透传抽象。

仅修改了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-PEKBJh/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。未运行硬件验收，接收器硬件仍不可用且由人工负责。