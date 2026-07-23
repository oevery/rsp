已新增稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-uBMkAw/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 已实现的纯投影边界及其标准化、拒绝空标识、不可变输出行为。
  - 桌面生产事件流尚未接入该边界。
  - 硬件验收仍不可用且由人工负责。
- 决策记录：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无。
- 可归档：no

验证已通过：`mise exec -- pnpm test -- device-discovery`（2 passed）；新增文档通过空白错误检查。未修改 Change、代码或既有工作区改动；硬件验收保持 unavailable。