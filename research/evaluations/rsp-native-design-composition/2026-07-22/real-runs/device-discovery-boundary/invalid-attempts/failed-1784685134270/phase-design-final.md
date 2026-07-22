已完成设计阶段，仅更新同一 WorkRef 的 `## Design`：

- WorkRef：`device-discovery-boundary`
- 所有权：Desktop runtime adapter 负责物理发现与连接生命周期；`client/packages/device-discovery` 只负责纯事件投影。
- 依赖方向：`desktop runtime adapter -> device-discovery`；Web 不得直接发现硬件。
- Seam：保留 `projectDeviceEvent(input)`，负责 `id` trim、空值拒绝、`connected` 保留与不可变投影；不承担连接、监听、重试或缓存。
- 真实桌面调用链尚无仓库证据，因此未声称已接入或硬件验收通过。
- 后续 durable 文档候选为 `docs/architecture/device-discovery-boundary.md`，但只能在实现、只读 review 完成且获得明确授权后写入。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档；未执行实现或 review。

## RSP Continuation
- WorkRef: `device-discovery-boundary`
- Authority: `AGENTS.md`, `client/AGENTS.md`, `client/CONTEXT.md`, `.rsp/changes/device-discovery-boundary.md`
- Current state: completed；模块边界已在同一 Change 的 Design 中确定
- Changed artifacts: `.rsp/changes/device-discovery-boundary.md`
- Fresh verification: `git diff --check` 通过；`npx --no-install rsp check --focused` 通过
- Blockers: 接收器硬件验收不可用，human owned
- Next action: 在获得实现授权后，按已确定 seam 实现 runtime-neutral 投影及聚焦测试