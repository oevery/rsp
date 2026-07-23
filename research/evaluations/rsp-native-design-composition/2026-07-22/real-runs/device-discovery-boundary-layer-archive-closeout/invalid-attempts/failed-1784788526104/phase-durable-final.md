已创建稳定架构事实文档：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-c3C7OY/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - runtime-neutral 投影职责、公开契约与依赖约束。
  - 硬件验收仍不可用。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证：新文档通过 `git diff --no-index --check`。已采用请求中提供的最新审查证据：`mise exec -- pnpm test -- device-discovery` 通过（2 项）。未执行硬件验收，且仍不可用。未修改 Change、代码或测试；未执行任何 Git 生命周期操作。