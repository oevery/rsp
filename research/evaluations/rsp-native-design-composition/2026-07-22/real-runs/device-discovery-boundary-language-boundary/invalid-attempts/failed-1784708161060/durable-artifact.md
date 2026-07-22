# 设备发现边界

## 所有权与依赖

- 桌面运行时负责物理设备发现和连接生命周期。
- `client/packages/device-discovery` 仅负责运行时中立的设备事件投影，不得导入或调用桌面、Electron、Web 或硬件 API。
- 依赖方向为：桌面发现适配器 → `device-discovery` 投影 → 类型化消费者；Web 只能消费投影后的类型化数据，不得直接发现硬件。

## 公共投影契约

- 公共边界为 `projectDeviceEvent(input: { id: string, connected: boolean })`。
- 函数会去除 `id` 两端空白；去空白后的空 `id` 会抛出设备 ID 错误。
- 函数返回冻结的 `{ id, connected }` 对象，并原样保留 `connected`，不在该边界解释连接策略。

## 验证限制

- 包级自动化测试覆盖规范化、不可变性和空 ID 拒绝。
- 接收器硬件不可用；硬件验收仍为人工负责，尚未完成。
