已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-vITKzt/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - Desktop 负责物理发现与连接生命周期；runtime-neutral 包仅投影事件。
  - `projectDeviceEvent` 的规范化、不可变输出及边界约束。
  - Web 不得直接发现硬件；硬件验收仍不可用且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证：`git diff --check -- docs/architecture/device-discovery-boundary.md` 通过。未重跑测试；请求中提供的聚焦测试证据为 2 passed。未修改 Change、代码或其他文档，未暂存、提交或发布。