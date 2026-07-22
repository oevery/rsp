# 设备发现边界

## 所有权与依赖方向

- Desktop runtime 拥有物理设备发现和连接生命周期。
- `client/packages/device-discovery` 是 runtime-neutral 包，只拥有原始设备事件的纯投影；它不发现、打开、轮询或保存物理设备状态。
- Desktop 适配器向内依赖该包。Web 只能将投影后的事件作为类型化展示数据，不能直接发现硬件。

## 投影契约

- 公共边界为 `projectDeviceEvent(input)`，输入与输出均为 `{ id: string, connected: boolean }`。
- 投影会修剪 `id`；修剪后为空的 `id` 会被拒绝。
- 投影精确保留 `connected`，返回新的冻结对象。

## 验证边界

- 聚焦测试覆盖 `id` 修剪、空 `id` 拒绝、`connected` 保留、输出对象新建与不可变性。
- 接收器硬件不可用；硬件验收仍为人工负责，尚不可用。
