已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-uKBSEZ/docs/architecture/device-discovery-boundary.md)。

## Durable Decision

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面、运行时中立包与 Web 的设备发现边界及依赖方向。
  - `projectDeviceEvent` 的规范化、失败与不可变返回契约。
  - 硬件验收仍不可用且由人工负责。
- Decision Record：No Decision Record needed
- Decision Record 目标：N/A
- 写入理由：
  - none
- Archive ready：no

验证：`npx --no-install rsp check --focused` 通过；新增文档的 `git diff --check` 通过。未重跑代码测试，采用请求中提供的最新审查证据（2 通过、0 失败）。未修改 Change、代码或其他项目事实；未暂存、提交或发布。