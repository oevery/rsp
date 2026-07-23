# 设备发现边界

## 职责

- 桌面运行时拥有物理接收器的发现和连接生命周期。
- Web 只消费类型化投影，不直接发现硬件。
- `client/packages/device-discovery` 是运行时中立包：不得打开设备、管理连接生命周期或承担传输职责。

## 投影契约

- `projectDeviceEvent` 接受一个原始 `{ id, connected }` 记录，返回新的冻结 `{ id, connected }` 投影。
- 投影会修剪 `id`，保留 `connected`；修剪后为空的 `id` 会被拒绝。

## 集成与验收边界

- 当前仅聚焦测试导入 `projectDeviceEvent`；桌面适配器和 Web 尚未接入该公共 seam。不得将该包的存在视为桌面到 Web 投影链已完成。
- 接收器硬件不可用；硬件验收仍由人工负责，当前不可完成。
