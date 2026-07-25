已完成设计并回写同一 Change：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15)。

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前结论：runtime-neutral 包拥有纯事件投影；desktop adapter 保留物理发现与连接生命周期；接缝为 `projectDeviceEvent(input)`。
- 改动范围：仅更新该 Change 的 `## Design`。
- 验证结果：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 阻塞项：无；接收器硬件验收仍不可用且归人工负责。
- 后续动作：按该设计实施投影函数及聚焦测试。