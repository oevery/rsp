## 审查范围

- 比较：`HEAD` 与当前工作树；已明确执行 `git diff -- .rsp/changes/device-discovery-boundary.md client/packages/device-discovery/src/index.ts test/device-discovery.test.mjs`
- 意图：`.rsp/changes/device-discovery-boundary.md`、`client/AGENTS.md`、`client/CONTEXT.md`
- 代码：issues_found
- 文档：issues_found
- 排除项：除此三项外的所有文件；未审查硬件接收器验收

## 发现

### [P1] 投影函数未接入任何桌面生产调用方

- 工件类型：cross-artifact
- 维度：生产可达性与变更忠实性
- 位置：`.rsp/changes/device-discovery-boundary.md` 的 `## Design` / `Consumers and verification`；`client/packages/device-discovery/src/index.ts:1`
- 权威：Change 要求桌面适配器在发出原始记录后立即调用 `projectDeviceEvent`；`client/AGENTS.md` 规定桌面运行时拥有物理发现生命周期。
- 证据：最小调用链搜索仅找到模块自身及 `test/device-discovery.test.mjs` 的测试导入，没有桌面适配器或其他生产调用方。
- 影响：实际桌面事件不会经过 trim、空 ID 拒绝与不可变投影；Change 中“桌面适配器调用”的陈述也与当前仓库状态不符。
- 建议操作：在受授权的后续实现切片中接入实际桌面适配器，并将 Change 的最终事实与真实调用链对齐。
- 置信度：high

## 覆盖情况

- 已检查 Change、模块实现、聚焦测试、比较点实现及最小生产引用链。
- `git diff --check` 通过。
- `mise exec -- pnpm test -- device-discovery` 通过：2 passed，0 failed。
- 未验证接收器硬件；该项按项目权威保持 unavailable / human owned。

## 结论

findings。最小下一步是在明确实现授权下接入桌面生产调用方；当前变更不能证明运行时事件会经过该边界。