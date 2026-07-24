## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：该 Change 只包含一个有界设计问题，且结论已回写同一 Change 的 `## Design`。
- 模块所有者：`client/packages/device-discovery/src/index.ts` 负责纯事件投影。
- 依赖方向：Desktop 原始事件 → `projectDeviceEvent` → typed immutable projection；Web 仅消费投影，绝不发现硬件。
- 接缝：保持单一 `projectDeviceEvent` 函数，负责 ID trim、空值拒绝、`connected` 保留和冻结结果；不引入状态化服务或额外适配层。
- 备选方案：将规范化放入 Desktop 会耦合硬件生命周期；放入 Web 则违反展示层边界。

## 变更与验证

- 已修改：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`，未修改代码、测试、架构文档、Tasks、Verify 或 Blockers。
- 已验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件验收仍不可用，且本阶段未执行实现测试。
- 下一步：在相同 `device-discovery-boundary` 下实施投影与聚焦测试。