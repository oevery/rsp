WorkRef：`device-discovery-boundary`

已完成设计决策并写入：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-TTUN8B/docs/architecture/device-discovery-boundary.md)

结论：设备发现和连接生命周期属于 desktop runtime；`client/packages/device-discovery` 仅负责纯事件投影；Web 仅消费类型化投影，不能直接发现硬件。

已运行指定验证：`mise exec -- pnpm test -- device-discovery`，未通过。原因是测试由 `node --test` 运行却直接导入 Vitest 的 `it`，缺少 Vitest suite 上下文。本阶段仅允许写架构文档，未修复测试。未进行真实 receiver 硬件验收，也未 commit、push 或 deploy。