## 审查范围

- 比较基准：`HEAD` 工作树差异；已显式执行 `git diff --no-ext-diff -- ...`
- 意图依据：`device-discovery-boundary`、`client/AGENTS.md`、`client/CONTEXT.md`
- 代码：issues_found
- 文档：issues_found
- 排除范围：未检查其他文件差异；接收器硬件验收保持 unavailable / human owned

## 发现

### [P1] 投影函数未接入桌面事件发布边界

- 工件类别：cross-artifact
- 审查维度：生产可达性、变更一致性与可行性
- 位置：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`；`client/packages/device-discovery/src/index.ts:6`
- 依据：Change 要求在桌面适配器的事件发布边界调用 `projectDeviceEvent`，并在进入展示层前完成投影。
- 证据：限定调用链搜索仅发现测试调用；`client/` 内不存在桌面适配器或 `projectDeviceEvent` 的生产调用方。因此当前实现不会作用于任何硬件事件。
- 影响：设备 ID 不会在实际跨边界路径上被裁剪、拒绝空值或冻结，Change 所述的所有权与接缝约束尚未落地。
- 建议操作：在明确的桌面适配器发布边界接入该函数，并将该适配器纳入后续固定范围；或者修正 Change，使其不再声称已定义并要求该接入。
- 置信度：high

## 覆盖情况

- 已检查：指定 Change、`client/packages/device-discovery/src/index.ts`、`test/device-discovery.test.mjs`，以及最小调用链搜索。
- 测试文件相对 `HEAD` 无差异；现有两项测试覆盖裁剪、空 ID 拒绝和冻结。
- 已执行：`mise exec -- pnpm test -- device-discovery`，结果为 2/2 通过。
- 未验证：桌面运行时接入、真实接收器硬件验收；后者按 Change 保持 unavailable / human owned。
- 稳定设计资料 `.rsp/specs/design.md` 仍为占位模板，未提供可补充的具体约束。

## 结论

存在一个阻断正常路径的接缝缺失。最小下一步是先确定并纳入桌面事件发布方，再完成一次新的固定范围审查。