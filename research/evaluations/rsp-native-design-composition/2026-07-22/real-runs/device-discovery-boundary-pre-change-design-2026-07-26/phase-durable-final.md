已写入稳定架构事实：[device-discovery-boundary.md](<workspace>/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新已授权的 scoped architecture 文档。
- 决策记录（Decision Record）：无需创建。
- 可归档（Archive ready）：no。

文档明确了桌面运行时、运行时中立包和 Web 的职责边界，并说明硬件验收不可用且由人工负责；自动化测试不构成硬件验收。

已验证：文档内容复读、`git diff --check` 通过。未重新运行测试；请求上下文提供的聚焦测试结果为 2 passed。剩余风险：投影函数尚未接入桌面生产调用链，不能证明运行时事件会经过该边界。