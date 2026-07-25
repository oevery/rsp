已写入 [设备发现边界说明](<<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-ChVEcM/docs/architecture/device-discovery-boundary.md>)，仅包含已实现的稳定事实及验收边界；未创建 ADR，未修改 Change 或代码。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：No Decision Record needed
- 可归档：no

文档明确了桌面运行时、运行时中立包、Web 与硬件验收的四项边界，并说明自动化测试不是硬件验收。

已复核文档内容并通过新增文件的空白错误检查。审查提供的 `mise exec -- pnpm test -- device-discovery` 为 2 项通过；接收器硬件验收仍不可用且由人工负责。未执行暂存、提交或发布。