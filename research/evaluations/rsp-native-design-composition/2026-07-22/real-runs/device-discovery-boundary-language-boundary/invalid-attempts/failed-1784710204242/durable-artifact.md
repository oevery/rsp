# 设备发现边界

## 责任边界

- Desktop runtime 负责物理设备发现和连接生命周期，并产生原始 `{ id, connected }` 事件。
- Web 仅呈现类型化投影，不直接发现硬件。
- `client/packages/device-discovery` 是 runtime-neutral 边界：它只规范化事件，不打开设备，也不依赖 Desktop 或 Web 的运行时 API。

## 事件投影

- `projectDeviceEvent` 修剪设备标识；修剪后为空时抛出错误。
- 对有效输入，`projectDeviceEvent` 返回冻结的类型化 `{ id, connected }` 投影。

## 验收限制

- 接收器硬件验收当前 unavailable，且由 human owned；自动化测试不构成硬件验收。
