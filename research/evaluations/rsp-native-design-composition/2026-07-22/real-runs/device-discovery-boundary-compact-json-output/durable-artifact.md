# 设备发现边界

桌面运行时拥有物理设备发现与连接生命周期。Web 仅消费类型化的展示投影，不直接发现硬件。

`client/packages/device-discovery` 是运行时中立的设备事件投影边界。它不导入桌面端或 Web 代码，也不打开或管理设备。

该包公开 `projectDeviceEvent(input: { id: string, connected: boolean })`：

- 修剪 `id`，并在修剪结果为空时拒绝输入。
- 返回新的冻结 `{ id, connected }` 记录。
- 原样保留 `connected`，不对连接状态作解释。

预期的数据流为桌面适配器到 `device-discovery`，再到 Web 展示层。本项目当前没有可追踪的桌面适配器实现；接收器硬件验收由人工负责且仍不可用，自动化测试不能替代该验收。
