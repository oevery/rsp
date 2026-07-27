已完成所选边界实现。

- `projectDeviceEvent` 现会修剪设备 ID、拒绝空 ID，并返回冻结的投影对象。
- 已更新同一 Change 的任务与实测验证记录：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md)
- 已运行 `mise exec -- pnpm test -- device-discovery`：2 项通过，0 项失败。
- 已执行 `git diff --check`，无空白错误。

接收器硬件验收仍不可用且由人工负责；固定范围审查与持久化决策尚未执行。未进行暂存、提交、推送或其他 Git 生命周期操作。