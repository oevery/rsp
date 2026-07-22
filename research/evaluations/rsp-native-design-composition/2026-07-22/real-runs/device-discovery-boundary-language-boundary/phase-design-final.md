已完成 `device-discovery-boundary` 的受限设计，并仅更新同一变更的 `## Design`。

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：`client/packages/device-discovery` 拥有纯事件投影；桌面拥有硬件发现；Web 仅消费类型化投影。
- 依赖方向：桌面适配器 → 运行时中立包 → Web 消费方。
- 接口边界：`projectDeviceEvent` 负责修剪、拒绝空 ID、冻结返回记录；不引入适配器抽象。
- 依据：当前夹具只有该包的公开函数及其直接测试；桌面原始事件来源由 `client/CONTEXT.md` 明确。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件验收仍不可用，且保持人工负责。