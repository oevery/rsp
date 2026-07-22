# 设备发现边界

## 所有权

- 桌面运行时拥有物理设备发现和连接生命周期。
- `client/packages/device-discovery` 仅拥有运行时中立的设备事件投影；不得打开设备或管理连接生命周期。
- Web 仅消费类型化投影进行展示，且不得直接发现硬件、导入或调用桌面发现能力。

## 公共边界

- 桌面适配器向 `projectDeviceEvent(input: { id: string, connected: boolean })` 传入原始 `{ id, connected }` 记录。
- 该函数同步返回冻结的 `{ id, connected }` 记录，修剪 `id`，并拒绝修剪后为空的 `id`。
- `client/packages/device-discovery` 不得依赖桌面或 Web 代码；类型化消费者只消费该投影。

## 非职责范围与验收

- 此边界不负责设备打开、连接状态管理、事件排序、取消、配置或重试。
- 接收器硬件不可用；硬件验收保持 `unavailable; human owned`，不得由自动化测试替代。
