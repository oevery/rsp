# 设备发现边界

## 所有权与依赖方向

- Desktop runtime 拥有物理设备发现和连接生命周期。
- `client/packages/device-discovery` 是 runtime-neutral 事件投影边界：它不打开设备、不订阅硬件事件，也不依赖 desktop 或 Web runtime。
- Desktop adapter 将原始 `{ id, connected }` 事件单向传入该边界；desktop 或 Web 上层消费者只消费其 typed projection。Web 不直接发现硬件。

## 事件投影契约

`client/packages/device-discovery/src/index.ts` 公开 `projectDeviceEvent(input)`。该函数：

- 接受 `id: string` 和 `connected: boolean`；
- 裁剪 `id`，并在裁剪后为空时拒绝输入；
- 保留 `connected` 的值；
- 返回冻结的 `{ id, connected }` 投影。

该边界不负责事件订阅、连接状态、缓存、重试或 runtime 配置。

## 验收边界

自动化测试覆盖投影的规范化、空 ID 拒绝与返回值不可变性。接收器硬件验收仍不可用，且由人工持有；自动化测试不构成物理发现验收。真实 desktop adapter 接入时，应验证其单向调用 `projectDeviceEvent`。
