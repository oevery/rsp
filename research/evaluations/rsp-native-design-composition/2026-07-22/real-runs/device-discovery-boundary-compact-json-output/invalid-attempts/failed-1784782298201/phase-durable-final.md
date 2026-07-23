已创建并写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 现状事实：Update existing spec or scoped instruction
- 现状事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面、运行时无关投影包与 Web 的职责边界。
  - `projectDeviceEvent` 的规范化、空标识拒绝、不可变返回与无副作用契约。
  - 硬件验收仍不可用且由人工负责人执行。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证通过：`mise exec -- pnpm test -- device-discovery`（2 项通过）、`git diff --check`、`npx --no-install rsp check --focused`。

未声称桌面适配器已接线；该生产调用链仍是审查发现的后续实现项。未修改 Change、代码或测试，未执行 Git 生命周期操作。