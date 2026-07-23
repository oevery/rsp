## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 单一问题：已确认；仅解决模块归属、依赖方向与事件投影接缝，并回写同一工作引用。
- 结论：桌面适配器保留硬件发现与连接生命周期；`client/packages/device-discovery/src/index.ts` 负责 `projectDeviceEvent` 的运行时中立投影；依赖方向为桌面适配器 → 中立包 → Web。
- 接缝：`projectDeviceEvent(input)` 同步完成 ID 去空白、空 ID 拒绝、`connected` 保持及不可变输出；不承担硬件或连接管理。
- 已修改：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未运行实现测试；接收器硬件验收仍不可用。
- 后续：按同一 `device-discovery-boundary` 实施投影与聚焦测试。