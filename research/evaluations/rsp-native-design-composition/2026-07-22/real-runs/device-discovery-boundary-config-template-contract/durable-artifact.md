# 设备发现边界

## 职责与依赖方向

- 桌面运行时负责物理设备发现和连接生命周期，并产生原始 `{ id, connected }` 记录。
- `client/packages/device-discovery` 是运行时中立的边界包，负责纯函数 `projectDeviceEvent` 规范化。
- Web 只消费类型化投影，不直接发现硬件。
- 依赖方向为：桌面适配器 -> `client/packages/device-discovery` -> 类型化 Web 消费者。边界包不得导入桌面或 Web 模块；Web 不得绕过边界包发现硬件。

## 事件投影契约

- `projectDeviceEvent` 同步且无状态地接收原始 `{ id, connected }` 记录。
- 它会裁剪 `id`、保留 `connected`，并返回冻结的 `{ id, connected }` 投影。
- 裁剪后的空 `id` 会同步抛出包含 device id 的错误。
- 此包不打开设备、不保存生命周期状态，也不暴露原始发现 API。

## 验证边界

- 聚焦自动化测试覆盖标识规范化、空标识拒绝和返回值不可变性。
- 接收器硬件验收仍不可用，且为人工负责的验收项；自动化测试不代表硬件验收通过。
