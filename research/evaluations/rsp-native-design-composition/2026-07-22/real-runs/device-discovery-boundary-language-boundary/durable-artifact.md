# 设备发现边界

- Desktop runtime 负责物理设备发现与连接生命周期。
- Web 仅是类型化展示投影，绝不直接发现硬件。
- `client/packages/device-discovery` 拥有运行时中立的 `projectDeviceEvent` 边界。它是纯投影，不导入运行时 API，也不打开或观察设备。
- `projectDeviceEvent` 接收原始 `{ id, connected }` 记录，修剪 `id`，拒绝归一化后为空的 `id`，保持 `connected` 不变，并返回冻结的 `{ id, connected }` 记录。
- 自动化测试覆盖归一化、空 `id` 拒绝和不可变性。接收器硬件验收仍不可用，由人工负责。
