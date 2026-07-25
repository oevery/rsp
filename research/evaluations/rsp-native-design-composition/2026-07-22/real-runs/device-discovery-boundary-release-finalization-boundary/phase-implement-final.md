已完成限定实现：

- `projectDeviceEvent` 现在会修剪 ID、拒绝空 ID，并返回冻结的新对象。
- 更新同一 Change 的任务与测试证据。
- 未触及桌面/Web 运行时、未进行 Git 操作。

验证已通过：

`mise exec -- pnpm test -- device-discovery`：2 passed。

剩余事项：固定范围只读审查、Core 持久化审查，以及硬件验收（硬件不可用，仍由人工负责）。