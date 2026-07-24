## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-ZHamI6/docs/architecture/device-discovery-boundary.md)
- 决策记录（Decision Record）：No Decision Record needed
- 可归档（Archive ready）：no；接收器硬件验收仍不可用，自动化测试不能替代硬件验收。

已验证：`git diff --check -- docs/architecture/device-discovery-boundary.md` 通过；`npx --no-install rsp check --focused` 通过。未暂存、提交或修改 Change、代码。