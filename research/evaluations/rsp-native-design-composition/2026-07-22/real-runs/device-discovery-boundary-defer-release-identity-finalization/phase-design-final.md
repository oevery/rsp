## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：已确认单一有界设计问题，并将结论回写至同一 Change 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 拥有纯事件投影；桌面运行时保留硬件发现与连接生命周期。
- 依赖方向：桌面原始事件 → `projectDeviceEvent` → Web 等展示消费者的不可变类型化记录；中立包不依赖桌面或 Web。
- 接口缝：包入口仅暴露无状态 `projectDeviceEvent(input)`，负责修剪、空值拒绝、保留连接状态并冻结结果；不管理硬件、监听器或连接状态。
- 取舍：未将规范化放进桌面适配器，避免把共享事件不变量绑死在硬件所有者；也未引入更宽的发现接口。
- 已修改：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未执行：未运行测试；本阶段未修改代码或测试，且硬件验收仍不可用、由人工负责。
- 后续动作：在同一 `device-discovery-boundary` 中实施投影与聚焦测试。