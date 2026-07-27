已完成受跟踪设计，并返回同一工作引用（WorkRef）：`device-discovery-boundary`。

仅更新了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`：

- 所有者：`client/packages/device-discovery` 负责纯事件投影；桌面运行时保留物理发现与连接生命周期。
- 依赖方向：桌面适配器 → runtime-neutral 投影 → Web 展示；禁止反向依赖或硬件访问。
- 接缝：保留 `projectDeviceEvent(input)` 作为唯一纯函数公开接缝，负责 trim、空值拒绝和不可变投影。
- 未遗留所有者决策；下一步可在同一 Change 内实现。

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未运行硬件验收；硬件不可用。