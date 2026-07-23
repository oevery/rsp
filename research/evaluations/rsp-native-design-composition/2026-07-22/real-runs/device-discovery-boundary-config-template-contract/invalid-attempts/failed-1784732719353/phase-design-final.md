## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：确定设备发现的模块所有权、依赖方向与投影接缝。
- 建议：桌面运行时拥有物理发现与连接生命周期；`client/packages/device-discovery` 拥有纯投影接缝；Web 仅消费类型化投影。
- 依赖方向：`desktop adapter -> @client/device-discovery -> typed Web projection`
- 接缝义务：`projectDeviceEvent` 修剪 `id`、拒绝空值、保留 `connected`，并返回新的不可变投影；不承担设备打开、传输或生命周期职责。
- 备选方案：桌面侧归一化会耦合物理运行时；Web 侧归一化会错误地让展示层承担硬件有效性，两者均不采用。
- 已更新：仅 [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-i3YUNU/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未实现代码或测试；接收器硬件不可用，硬件验收仍由人工负责。
- 下一步：由同一工作引用（WorkRef）实施投影与聚焦测试。