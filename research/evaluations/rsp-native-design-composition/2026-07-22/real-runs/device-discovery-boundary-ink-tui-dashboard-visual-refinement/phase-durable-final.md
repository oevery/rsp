已新增 [设备发现投影边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-5RlCRc/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：包级纯投影的已实现契约；桌面生产调用尚未接入；自动化测试不构成硬件验收，接收器硬件验收仍不可用且人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 可归档（Archive ready）：no

验证：文档已复读，无尾随空白；已有受限范围差异通过 `git diff --check`。未重新运行测试（本次仅新增文档）；审查上下文中的最新结果为 `mise exec -- pnpm test -- device-discovery` 通过 2 项。

未修改 Change、代码或测试，也未执行暂存、提交、推送等操作。