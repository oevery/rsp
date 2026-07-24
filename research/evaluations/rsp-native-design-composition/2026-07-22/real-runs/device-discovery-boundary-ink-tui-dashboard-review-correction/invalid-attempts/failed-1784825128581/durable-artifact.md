# 设备发现边界

## 所有权

- 桌面运行时独占物理设备发现与连接生命周期。
- Web 只消费类型化展示投影，不直接发现硬件。
- 运行时中立包可以拥有纯事件规范化，但不得打开设备或依赖硬件 API。

## 事件投影

- `client/packages/device-discovery` 提供 `projectDeviceEvent(input)`，将桌面适配器的原始 `{ id, connected }` 记录投影为不可变的 `DeviceEvent`。
- 投影会裁剪 `id`，保留 `connected`；规范化后为空的 `id` 会同步被拒绝，调用方不得转发无效投影。
- 依赖方向为 `desktop adapter -> @client/device-discovery -> typed presentation consumer`。该包不依赖桌面、Web 或硬件 API，因此可以在没有接收器硬件时进行单元测试。

## 验收边界

- 接收器硬件验收当前不可用；自动化测试不构成硬件验收。
