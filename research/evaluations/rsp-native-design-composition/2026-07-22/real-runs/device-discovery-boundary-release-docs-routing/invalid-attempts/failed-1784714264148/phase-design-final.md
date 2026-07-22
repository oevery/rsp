## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：该 Change 含一个有界设计问题，已仅回写同一 Change 的 `## Design`。
- 模块所有者：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent` 投影；desktop 仍拥有物理发现与连接生命周期。
- 依赖方向：desktop → runtime-neutral package；Web 仅消费投影结果，不能依赖或触发发现。
- 接缝：包入口公开同步 `projectDeviceEvent(input)`，负责 trim、空 id 拒绝、不可变新对象投影；不拥有设备句柄、订阅、重试或运行时状态。
- 备选方案：未将规范化放入 desktop adapter，避免未来 typed consumer 重复策略；未引入额外 adapter/interface，因为当前仅需一个纯转换。
- 变更文件：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-KCd2xK/.rsp/changes/device-discovery-boundary.md:15)

验证已通过：`git diff --check`、`npx --no-install rsp check --focused`。未运行实现测试；接收器硬件验收仍不可用且由人工负责。