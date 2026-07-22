已完成 Core 的双轴持久化决策，并仅新增 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-KCd2xK/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - Desktop、Web 与运行时无关投影包的设备发现职责及依赖方向。
  - `projectDeviceEvent(input)` 的规范化、拒绝空标识和不可变输出契约。
  - 自动化测试与人工硬件验收的边界。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无；实现采用的边界没有需要额外长期保留的难逆取舍。
- 可归档（Archive ready）：no

验证：新文档通过 `git diff --no-index --check`。未重跑测试；本次未改代码，且请求提供的最新审查证据已确认 `mise exec -- pnpm test -- device-discovery` 通过。接收器硬件验收仍不可用且由人工负责。未修改 Change、代码或 Git 状态。