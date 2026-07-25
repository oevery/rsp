## 持久化决策

- 当前事实：更新已授权的架构文档
- 当前事实目标：[设备发现边界](docs/architecture/device-discovery-boundary.md)
- 决策记录（Decision Record）：不需要
- 可归档（Archive ready）：否

已只新增该架构文档，明确四项边界事实，并说明自动化测试不是硬件验收，也不代表生产调用链已接入。

验证已通过：`mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）；文档空白检查通过。

仍有阻塞：接收器硬件验收不可用且由人工负责；审查发现的生产调用链未接入问题也尚未解决。未修改 Change、代码或测试，未执行暂存、提交或发布。