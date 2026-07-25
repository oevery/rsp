已完成设计解析并回写同一 WorkRef：`device-discovery-boundary`。

- 单一设计问题已确认：模块 owner、依赖方向与 seam。
- 仅修改了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-yTGgHF/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 结论：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent` 投影；依赖方向为 desktop runtime → runtime-neutral package → Web；桌面仍拥有硬件发现与连接生命周期。
- seam 明确了输入、标准化、空 ID 拒绝、不可变输出，以及不得承担硬件/状态职责。
- 验证通过：`git diff --check`、`npx --no-install rsp check --focused`。
- 未运行测试：本阶段只允许设计文档变更，且硬件验收仍不可用、由人工负责。

## RSP 后续

- 工作引用（WorkRef）: `device-discovery-boundary`
- 权威依据: `client/AGENTS.md`、`client/CONTEXT.md`、`.rsp/changes/device-discovery-boundary.md`
- 当前状态: 已完成设计；同一 Change 可进入实现阶段
- 已修改工件: `.rsp/changes/device-discovery-boundary.md`
- 最新验证: `npx --no-install rsp check --focused` 通过
- 阻塞项: 无；硬件验收为后续人工验证边界
- 下一步: 在同一 WorkRef 中实现投影与聚焦测试。