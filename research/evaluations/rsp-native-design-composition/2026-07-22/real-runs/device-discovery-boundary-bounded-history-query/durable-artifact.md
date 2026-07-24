# 设备发现边界

## 职责边界

- 桌面运行时负责物理接收器发现、连接生命周期，以及发出原始 `{ id, connected }` 记录。
- `client/packages/device-discovery` 是 runtime-neutral 边界：仅负责将原始发现记录投影为不可变的类型化设备事件；不得导入桌面或 Web 运行时代码、打开设备、订阅发现事件或保存连接状态。
- Web 仅消费投影后的设备事件，绝不直接发现硬件。

## 公共投影接口

- `client/packages/device-discovery/src/index.ts` 导出同步纯函数 `projectDeviceEvent(input)`。
- 该函数修剪 `id`，拒绝修剪后为空的设备 ID，保留 `connected`，并返回新的冻结 `{ id, connected }` 记录。
- 依赖方向为 `desktop runtime -> device-discovery package <- web presentation`。

## 验收边界

- 聚焦自动化测试验证软件投影行为、不可变性和空设备 ID 拒绝；自动化测试不是硬件验收。
- 接收器硬件验收当前不可用，仍由人工负责；不得因自动化测试通过而宣称硬件验收完成。
