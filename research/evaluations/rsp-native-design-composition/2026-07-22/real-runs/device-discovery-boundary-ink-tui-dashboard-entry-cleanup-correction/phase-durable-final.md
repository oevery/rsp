已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-yt7C9D/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - runtime-neutral 投影的职责、纯函数边界与不可变输出
  - `id` 规范化/拒绝规则，以及桌面、Web 的依赖边界
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

已验证该文档内容并通过 `git diff --check`。未运行测试；采用请求中提供的最新证据：`mise exec -- pnpm test -- device-discovery` 通过 2 项。接收器硬件验收仍不可用且由人工负责；未修改 Change、代码或其他文件，未执行 Git 生命周期操作。