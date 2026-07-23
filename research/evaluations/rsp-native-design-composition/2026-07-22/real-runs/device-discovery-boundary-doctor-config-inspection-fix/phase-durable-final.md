## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-3TBa9u/docs/architecture/device-discovery-boundary.md)
- 写入事实：
  - 桌面运行时、运行时中立投影包与 Web 的职责边界。
  - `projectDeviceEvent` 的规范化、拒绝空标识、冻结投影和无状态约束。
  - 自动化测试与人工硬件验收的边界。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档：no

仅新增指定架构文档；未修改 Change、代码或测试，未执行 Git 操作。已通过 `git diff --check`。接收器硬件验收仍不可用。