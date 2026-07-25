已完成同一工作引用（WorkRef）`device-discovery-boundary` 的设计收敛。

- 仅更新了 [变更文件](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 明确模块归属：`client/packages/device-discovery` 负责纯事件投影；桌面端保留硬件发现与连接生命周期。
- 明确依赖方向：桌面适配器 → 投影包 → Web 类型化呈现；Web 不直接发现硬件。
- 明确接缝：唯一纯函数 `projectDeviceEvent`，负责修剪、空标识拒绝与不可变投影。
- 比较了将规范化置于桌面端或 Web 的替代方案，并排除了无证据支持的额外适配器接口。

验证已通过：`git diff --check`、`npx --no-install rsp check --focused`。未运行硬件验收；该项仍不可用且由人工负责。未暂存、提交或改动代码、测试、任务、验证项、阻塞项或架构文档。