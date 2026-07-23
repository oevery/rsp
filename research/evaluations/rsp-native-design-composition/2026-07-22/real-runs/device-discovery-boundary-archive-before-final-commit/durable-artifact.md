# 设备发现边界

## 所有权

- 桌面运行时拥有物理设备发现和连接生命周期，并发出原始 `{ id, connected }` 记录。
- Web 仅消费类型化展示投影，不直接发现硬件。

## 运行时中立接缝

- `client/packages/device-discovery/src/index.ts` 提供 `projectDeviceEvent`，作为原始设备事件的公共投影接缝。
- `projectDeviceEvent` 会修剪 `id`，在返回前拒绝修剪后为空的标识，并返回新的冻结 `{ id, connected }` 类型化记录。
- 该包只承担纯规范化；不得打开设备、保存连接生命周期状态，或导入桌面和 Web 模块。

## 依赖方向与验证边界

- 依赖方向为 `desktop adapter -> runtime-neutral device-discovery package -> Web presentation`。
- 自动化验证覆盖纯投影接缝；物理接收器硬件验收仍为 unavailable，且由人工负责，未覆盖物理发现或连接生命周期。
