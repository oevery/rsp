已完成持久化决策并新增架构事实说明：[设备发现边界](<<workspace>/docs/architecture/device-discovery-boundary.md>)。

- 写入四项当前边界事实及“自动化测试不构成硬件验收”。
- 未创建决策记录（ADR）：无需持久化额外取舍理由。
- 运行 `npx --no-install rsp check --focused` 通过；文档差异检查通过。
- 物理接收器验收仍不可用且由人工负责，Change 仍不可归档。
- 未改动 Change、代码或测试；未执行暂存、提交、发布等 Git 操作。