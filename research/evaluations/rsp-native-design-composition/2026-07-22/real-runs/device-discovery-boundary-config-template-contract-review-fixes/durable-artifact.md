# 设备发现边界

## 当前边界

- 物理设备发现和连接生命周期属于桌面运行时；Web 仅消费面向展示的类型化记录，不能直接发现硬件。
- `client/packages/device-discovery` 提供运行时中立的同步投影函数 `projectDeviceEvent(input)`。该包不打开设备，也不持有设备句柄、监听器、传输、重试策略或生命周期状态。
- `projectDeviceEvent` 接收 `{ id, connected }`，修剪 `id`，在修剪后的标识为空时抛出错误，保留 `connected`，并返回冻结的 `{ id, connected }` 记录。

## 当前限制

- 仓库中尚无桌面适配器或其他生产调用者将原始设备事件传入 `projectDeviceEvent`；因此该投影尚未接入桌面到展示层的实际事件流。
- 物理接收器硬件不可用，硬件验收仍不可用且由人工负责。
