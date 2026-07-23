已将稳定架构事实写入 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LajUEy/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面、运行时中立投影包与 Web 的职责及依赖方向。
  - `projectDeviceEvent` 的规范化、拒绝空标识与不可变投影边界。
  - 硬件验收不可用且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无
- 可归档（Archive ready）：no

已验证新增文档内容并通过 `git diff --check`。未运行测试；采用请求中提供的最新审查证据：`mise exec -- pnpm test -- device-discovery` 通过 2 项。接收器硬件验收仍为 unavailable。未修改 Change、代码或测试，未执行任何 Git 生命周期操作。