# 设备发现边界

## 职责

- 桌面运行时负责物理设备发现、连接生命周期和原始 `{ id, connected }` 事件的产生。
- `client/packages/device-discovery` 仅负责运行时中立的设备事件投影策略。
- Web 仅消费已投影的事件用于展示，不直接发现硬件。

## 边界

- 桌面适配器、`device-discovery` 和 Web 的依赖方向为：桌面适配器 -> `device-discovery` -> Web 展示消费者。
- `device-discovery` 不导入桌面或 Web 模块，不打开设备，不保存连接状态，也不调用展示代码。
- `projectDeviceEvent` 是公开投影边界：它接收原始 `{ id, connected }` 记录，去除 `id` 首尾空白，拒绝空的规范化 `id`，保留 `connected`，并返回冻结的 `{ id, connected }` 值。

## 验收边界

- 接收器硬件当前不可用；硬件验收由人工负责，自动化测试不能替代该验收。
