# 设备发现边界

## 当前边界

- 物理设备发现和连接生命周期属于桌面运行时；Web 不直接发现硬件。
- `client/packages/device-discovery/src/index.ts` 提供 runtime-neutral 的 `projectDeviceEvent(input)` 边界。它不打开设备，也不承担连接生命周期、配置、取消或硬件错误处理。
- `projectDeviceEvent` 接收 `{ id, connected }`：会裁剪 `id`，拒绝裁剪后为空的 `id`，保留 `connected` 的布尔值，并返回冻结的 `{ id, connected }` 投影。

## 集成状态与约束

- 当前仓库中该包的唯一已验证调用方是聚焦测试；尚无桌面适配器或 Web 生产调用方。桌面运行时 → `device-discovery` 包 → Web 展示是后续接入应遵循的依赖方向，不是当前已实现的生产调用链。
- 接收器硬件不可用；自动化测试只验证纯投影契约，不能替代硬件验收。
