已新增稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LbbpD3/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - `projectDeviceEvent` 的纯投影契约与非职责边界。
  - 当前没有生产调用方；完整链路仅是后续接入方向。
  - 硬件验收仍不可用，自动化测试不能替代它。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed）；`git diff --check` 通过。

未修改 Change 或代码。原 Change 中审查指出的生产调用链表述仍在，因授权范围限制未处理。