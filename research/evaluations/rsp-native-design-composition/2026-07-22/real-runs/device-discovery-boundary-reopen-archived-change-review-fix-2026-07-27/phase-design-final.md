已完成同一 WorkRef `device-discovery-boundary` 的 Tracked Design。

- 已确认设计问题有界：模块所有者、依赖方向与接缝。
- 仅更新了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 决议：`client/packages/device-discovery` 持有纯投影；依赖方向为 desktop adapter → `device-discovery` → Web；公开接缝为 `projectDeviceEvent(input)`。
- 已写明聚焦单测边界与硬件验收仍不可自动完成的限制。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未修改代码、测试、Tasks、Verify、Blockers 或架构文档；未执行任何 Git 生命周期操作。