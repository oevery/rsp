# 设备发现投影边界

## 当前边界

- `client/packages/device-discovery` 提供运行时中立、同步的 `projectDeviceEvent` 纯投影；它不打开设备，也不承担发现连接生命周期、事件排序、取消或配置。
- `projectDeviceEvent` 接收 `{ id, connected }`，会修剪 `id`、拒绝修剪后为空的 ID、保留 `connected` 的布尔值，并返回冻结的 `{ id, connected }` 记录。
- 物理设备发现与连接生命周期仍归桌面运行时所有；Web 不直接发现硬件。

## 当前接入状态

- 当前仓库中尚无桌面发现适配器对 `projectDeviceEvent` 的生产调用者。因此上述投影 API 已实现，但尚不能视为已在桌面设备事件生产路径生效。

## 验证边界

- 自动化测试已覆盖 ID 规范化、空 ID 拒绝和返回记录不可变；自动化测试不是接收器硬件验收。
- 接收器硬件验收仍不可用，且由人工负责；本项目尚未取得该验收证据。
