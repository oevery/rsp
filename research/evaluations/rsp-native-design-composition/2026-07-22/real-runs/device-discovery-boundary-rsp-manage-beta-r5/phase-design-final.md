已确认该 Change 是单一、边界明确的设计问题，设计结果已写回同一工作引用（WorkRef）`device-discovery-boundary` 的 `## Design`。

- 模块所有者：`client/packages/device-discovery`
- 依赖方向：desktop adapter → runtime-neutral package
- 接缝：`projectDeviceEvent(...)`，覆盖规范化、空 ID 拒绝与不可变输出
- 未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或持久化文档

验证通过：`npx --no-install rsp check --focused`、`git diff --check`。硬件验收仍不可用，归人工负责。