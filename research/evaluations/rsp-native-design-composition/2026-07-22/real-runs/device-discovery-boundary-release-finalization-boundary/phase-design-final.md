已完成同一工作引用（WorkRef）`device-discovery-boundary` 的模块设计，并仅更新其 `## Design`。

- 模块归属：`client/packages/device-discovery`
- 依赖方向：桌面适配器 → `projectDeviceEvent` → Web 展示消费者
- 接缝：纯同步投影函数；复制并冻结记录、裁剪 `id`、拒绝空 `id`；不承担硬件生命周期策略
- 备选方案：已排除在桌面或 Web 中归一化

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未运行测试，也未进行硬件验收；未修改代码、测试、任务、验证项或阻塞项。

## 后续衔接

- 工作引用（WorkRef）: `device-discovery-boundary`
- 当前状态: 设计已解决，等待实现
- 已改动文件: `.rsp/changes/device-discovery-boundary.md`
- 最新验证: `npx --no-install rsp check --focused` 通过
- 阻塞项: 无；接收器硬件验收仍由人工负责
- 下一步: 在同一 Change 内实现 `projectDeviceEvent` 并运行聚焦测试