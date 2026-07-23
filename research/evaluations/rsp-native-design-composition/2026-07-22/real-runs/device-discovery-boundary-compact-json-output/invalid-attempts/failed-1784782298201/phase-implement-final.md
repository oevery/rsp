已实现设备发现投影边界并更新同一 Change。

- `projectDeviceEvent` 现会裁剪 id、拒绝空 id，并返回冻结的新对象。
- 聚焦测试补充了“不复用输入引用”的断言。
- Change 已记录 2 项实施完成及实际测试证据。

验证：

`mise exec -- pnpm test -- device-discovery`：2 通过，0 失败。

## RSP 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：partial；代码与聚焦测试已完成。
- 已改动文件：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`、`test/device-discovery.test.mjs`
- 阻塞项：接收器硬件验收不可用，需由人类硬件负责人执行。
- 下一步：完成硬件验收；固定范围只读审查与 Core 持久化决策仍未执行。