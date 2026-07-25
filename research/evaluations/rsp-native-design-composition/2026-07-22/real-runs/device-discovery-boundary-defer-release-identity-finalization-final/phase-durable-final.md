已写入 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-Et9SVu/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面端运行时拥有物理设备发现。
  - 运行时中立包只投影设备事件。
  - Web 不直接发现硬件。
  - 接收器硬件验收不可用且由人工负责。
  - 自动化测试不是硬件验收。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证：`git diff --check -- docs/architecture/device-discovery-boundary.md` 通过；`npx --no-install rsp check --focused` 通过。未重跑测试，因为本次仅新增架构文档；采用请求中提供的最新测试证据（2 passed）。未修改 Change、代码或其他文件。