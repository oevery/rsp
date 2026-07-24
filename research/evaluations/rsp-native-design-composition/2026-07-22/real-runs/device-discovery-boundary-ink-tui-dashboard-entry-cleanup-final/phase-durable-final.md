已完成 Core 的双轴持久化决策，并仅新增了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-epgO47/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 要写入的事实：
  - Desktop、Web 与 runtime-neutral package 的职责边界。
  - `projectDeviceEvent` 的规范化、拒绝空 ID、不可变返回值及非职责范围。
  - 自动化测试不是接收器硬件验收；硬件验收仍不可用且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 要写入的理由：none
- 可归档（Archive ready）：no

验证已通过：`mise exec -- pnpm test -- device-discovery`（2 passed）及文档限定路径 `git diff --check`。未执行硬件验收；它仍为明确阻塞项。未修改 Change、代码或测试，也未进行暂存、提交或发布操作。