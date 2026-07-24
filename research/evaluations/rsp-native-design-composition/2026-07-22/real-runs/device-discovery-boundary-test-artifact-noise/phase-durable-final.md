已仅新增 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-h893DS/docs/architecture/device-discovery-boundary.md)，写明四项稳定边界及“自动化测试不是硬件验收”。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理设备发现。
  - 运行时中立包仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收仍不可用且由人工负责；自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：none
- 可归档（Archive ready）：no

已验证文档内容并执行 `git diff --check -- docs/architecture/device-discovery-boundary.md`，无空白错误。未重新运行测试；本次仅改文档，测试结论采用请求中提供的最新只读审查证据。Change 和源码的既有修改均未触碰。