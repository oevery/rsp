## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：[设备发现边界](<<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LNm6ZH/docs/architecture/device-discovery-boundary.md>)
- 决策记录（Decision Record）：No Decision Record needed
- 可归档：no

已仅写入指定架构文档，记录桌面、运行时中立包与网页展示端的职责边界，以及投影函数的规范化、拒绝和不可变约束。未改 Change、代码或测试，未创建 ADR。

验证：`npx --no-install rsp check --focused` 通过；新增文档空白检查通过。接收器硬件验收仍不可用，未声称通过；本轮未运行测试。