# 设备发现边界

## 稳定架构事实

- 桌面运行时拥有物理设备发现和连接生命周期。
- Web 仅提供类型化的展示投影，不直接发现硬件。
- 运行时无关的包可以承载纯事件规范化，但不能打开设备。
- `client/packages/device-discovery/src/index.ts` 暴露 `projectDeviceEvent`，将输入的 `id` 和 `connected` 字段投影为新的事件记录。

## 验收限制

- 接收器硬件当前不可用；硬件验收仍为 `unavailable; human owned`，不能由自动化测试替代。
