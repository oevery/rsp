# 设备发现边界

## 所有权

- Desktop runtime 拥有物理设备发现和连接生命周期。
- Web 是类型化展示投影，不能直接发现或打开硬件。
- `client/packages/device-discovery` 与运行时无关，只拥有纯设备事件投影。

## 公共边界

- `projectDeviceEvent(input)` 接收原始 `{ id, connected }` 事件。
- 它会裁剪 `id`、拒绝裁剪后为空的值，并返回新的不可变 `{ id, connected }` 记录。
- 该包不拥有设备句柄、订阅、重试、生命周期状态或运行时配置。

## 依赖方向

- Desktop 适配器可以使用其原始事件调用 `projectDeviceEvent`。
- 运行时无关包不得导入 Desktop、Web、硬件或运行时 API。
- Web 可以消费投影后的值和类型，但不得依赖发现适配器。

## 验收限制

- 自动化测试只覆盖纯投影契约。
- 接收器硬件验收仍不可用，且由人工负责。
