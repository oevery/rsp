已创建稳定架构事实文档：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-kcADaO/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - Desktop、Web 与 runtime-neutral package 的设备发现边界和所有权
  - `projectDeviceEvent(input)` 的归一化、拒绝与不可变投影契约
  - 单测覆盖范围，以及接收器硬件验收仍为 unavailable
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证完成：`mise exec -- pnpm test -- device-discovery`（2 通过）；`git diff --check` 无输出；`npx --no-install rsp check --focused` 通过。未修改 Change、代码或测试；未执行暂存、提交、发布等操作。接收器硬件验收仍不可用。