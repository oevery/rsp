已完成 Core 的双轴持久化决策，并仅新增：

[设备发现边界文档](<workspace>/docs/architecture/device-discovery-boundary.md)

文档明确记录四项稳定事实，以及“自动化测试不是硬件验收”。

持久化决策：

- 当前事实：更新指定架构文档
- 决策记录（Decision Record）：无需创建
- 可归档（Archive ready）：否；接收器硬件验收仍不可用且由人工负责，Change 中的相应阻塞保持不变

验证：

- `mise exec -- pnpm test -- device-discovery`：2 项通过
- `git diff --check`：通过

未修改 Change、代码或测试；未执行暂存、提交、推送、合并、部署或发布。