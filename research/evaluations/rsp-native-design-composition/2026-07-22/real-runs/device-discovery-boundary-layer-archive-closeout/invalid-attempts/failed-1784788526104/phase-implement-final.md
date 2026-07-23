已实现运行时中立的设备事件投影：

- [index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-c3C7OY/client/packages/device-discovery/src/index.ts) 现在会裁剪 `id`、拒绝空值，并返回冻结的 `{ id, connected }` 对象。
- 同一 Change 已更新完成项与新鲜验证证据：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-c3C7OY/.rsp/changes/device-discovery-boundary.md)。

验证已执行并通过：

`mise exec -- pnpm test -- device-discovery`：2 个测试通过。

尚未完成：固定范围只读审查、持久化事实决策，以及接收器硬件验收；硬件仍不可用且由人工负责。未暂存、提交或发布。