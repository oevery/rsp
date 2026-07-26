## 结论

已确认并完成同一工作引用（WorkRef）`device-discovery-boundary` 的受跟踪设计，且仅更新了其 `## Design` 部分。

- 模块归属：`client/packages/device-discovery` 负责纯事件投影；桌面端保留硬件发现与连接生命周期。
- 依赖方向：desktop → projection → Web，禁止运行时中立包反向依赖桌面或 Web。
- 接缝：公共纯函数 `projectDeviceEvent(input)`；修剪 ID、拒绝空 ID、返回冻结的新记录，且不含设备 I/O 或生命周期策略。
- 备选方案：未将归一化留在桌面适配器，以避免消费者耦合和纯契约重复。

已通过：

- `git diff --check`
- `npx --no-install rsp check --focused`

未运行实现测试，也未进行硬件验收；本阶段未修改代码、测试、任务、验证、阻塞项或持久化文档。

变更见：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15)。