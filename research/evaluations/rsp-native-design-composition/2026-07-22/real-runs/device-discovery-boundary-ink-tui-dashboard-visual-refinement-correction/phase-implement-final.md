已完成所选边界实现。

- 修改 `client/packages/device-discovery/src/index.ts`：修剪 `id`、拒绝空值、保留 `connected`，并冻结返回对象。
- 更新同一 Change：标记设计与实现完成，记录测试观察结果。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2/2）。

接收器硬件验收仍不可用，且由人工负责；固定范围审查与持久化事实评估仍未执行。未暂存、提交、推送或发布。