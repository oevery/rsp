已完成同一工作引用（WorkRef）的设计回写：`.rsp/changes/device-discovery-boundary.md` 仅修改了 `## Design`。

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：模块 owner、依赖方向与 seam
- 结论：`client/packages/device-discovery` 负责 runtime-neutral 投影；依赖为 desktop adapter → `device-discovery`，Web 仅消费类型化结果；seam 为 `projectDeviceEvent(input)`。
- 备选方案：未把规范化放入 desktop 或 Web，避免策略重复或所有权反转。
- 验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 未验证：接收器硬件验收仍不可用且由人工负责。
- 下一步：在同一 `device-discovery-boundary` 实现投影与聚焦测试。