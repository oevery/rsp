已完成并回写同一 WorkRef：`device-discovery-boundary`。

- 仅修改了 `.rsp/changes/device-discovery-boundary.md` 的 `## Design`。
- 结论：`client/packages/device-discovery` 拥有纯事件投影；桌面运行时适配器依赖该包；`projectDeviceEvent` 是原始事件进入运行时中立层的唯一 seam。
- 明确了输入/输出约束、不可变性、空 id 拒绝、Web 非硬件发现边界与测试面。
- 当前 fixture 没有桌面适配器或真实消费链，已如实记录为证据缺口，未虚构接入。
- 未修改代码、测试、`Tasks`、`Verify`、`Blockers`、架构文档或 Git 状态。
- 验证通过：`git diff --check`、`npx --no-install rsp check --focused`。

## RSP Continuation

- WorkRef: `device-discovery-boundary`
- Authority: `.rsp/changes/device-discovery-boundary.md` 的 `## Design`
- Current state: completed；设计问题已收敛
- Changed artifacts: `.rsp/changes/device-discovery-boundary.md`
- Fresh verification: `npx --no-install rsp check --focused` 通过
- Blockers: none
- Next action: 在同一 WorkRef 内执行已定义的投影实现与聚焦测试。