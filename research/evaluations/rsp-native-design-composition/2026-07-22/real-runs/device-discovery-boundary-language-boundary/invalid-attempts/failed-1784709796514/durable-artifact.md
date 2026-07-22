# 设备发现边界

## 所有权

- Desktop runtime 负责物理设备发现和连接生命周期。
- Web 仅消费类型化投影，且不得直接发现硬件。
- `client/packages/device-discovery` 仅负责将单个桌面发现事件投影为 runtime-neutral 记录；不得打开设备、保存生命周期状态、执行 I/O，或定义事件订阅策略。

## 公共边界

- `client/packages/device-discovery/src/index.ts` 导出 `projectDeviceEvent`。
- `projectDeviceEvent` 接受原始 `{ id: string, connected: boolean }` 事件，返回冻结的 `{ id, connected }` 投影。
- 投影会修剪 `id`；修剪后为空的标识必须被拒绝；`connected` 值保持不变。
- runtime-neutral 包不得导入 desktop、Electron、browser 或 transport API。

## 验收限制

- 接收器硬件在当前环境不可用；自动化测试不能替代硬件验收，硬件验收仍由人类负责。
