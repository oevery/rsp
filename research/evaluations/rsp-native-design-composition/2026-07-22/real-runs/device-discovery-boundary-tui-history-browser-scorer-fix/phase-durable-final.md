已写入 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-ZEoxcY/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - Desktop runtime 负责物理设备发现。
  - runtime-neutral 包仅投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收仍不可用且由人工负责；自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证：文档内容复核通过；未跟踪文件的空白错误检查通过；`npx --no-install rsp check --focused` 通过。

未验证：未重新运行设备投影测试；未进行接收器硬件验收。审查指出桌面生产调用链尚未接入，仍需由后续实现处理。