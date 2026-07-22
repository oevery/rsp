已完成设计阶段并回写同一 WorkRef：`device-discovery-boundary`。

- 仅修改 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-Tsov0m/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 明确：Desktop runtime 拥有物理发现与连接生命周期；`client/packages/device-discovery` 仅拥有无运行时依赖的事件投影。
- 依赖方向：desktop adapter → runtime-neutral package → typed desktop/Web consumers；Web 不可发现硬件。
- seam：`projectDeviceEvent({ id, connected })`；裁剪并校验 `id`，返回冻结的投影对象，不接收硬件句柄、回调或生命周期配置。
- 记录了无桌面适配器/生产消费者的证据缺口，以及两个被拒绝的替代方案。

验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。未运行测试、未实现代码、未做 review、未修改 `Tasks`/`Verify`/`Blockers`/架构文档，也没有进行任何 Git 生命周期操作。接收器硬件仍不可用，未声称硬件验收通过。

## RSP Continuation
- WorkRef: `device-discovery-boundary`
- Authority: `AGENTS.md`、`client/AGENTS.md`、`client/CONTEXT.md`、`.rsp/changes/device-discovery-boundary.md`
- Current state: completed；唯一有界设计问题已解决并返回同一 Change
- Changed artifacts: `.rsp/changes/device-discovery-boundary.md`
- Fresh verification: `npx --no-install rsp check --focused` 通过；`git diff --check` 通过
- Blockers: 接收器硬件验收不可用，human owned
- Next action: 在明确实现授权后，按已定 seam 实现投影与聚焦测试。