## 审查范围

- 对比：Git index 至当前工作树的固定文件差异
- 意图：`.rsp/changes/device-discovery-boundary.md` 与 `client/CONTEXT.md`
- 代码：issues_found
- 文档：clean
- 排除：桌面适配器、Web 消费端和接收器硬件；均不在用户限定范围内

## 发现的问题

### [P1] 投影函数尚未接入桌面原始事件交接

- 工件类型：cross-artifact
- 维度：变更与规格一致性、生产可达性
- 位置：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`“Affected consumer and verification surface”
- 权威依据：Change 明确要求将桌面适配器的原始事件交接接入 `projectDeviceEvent`
- 证据：显式执行的 `git diff --no-ext-diff -- .rsp/changes/device-discovery-boundary.md client/packages/device-discovery/src/index.ts test/device-discovery.test.mjs` 仅包含 Change、包导出和聚焦测试；未包含桌面适配器调用方变更。因此在限定范围内无法证明生产路径会经过该投影。
- 影响：桌面事件仍可能以未裁剪、未校验、可变的原始记录到达消费者；包级测试通过不代表运行时边界生效。
- 建议操作：在后续获授权的实现范围内，将桌面原始事件交接直接调用 `projectDeviceEvent`，并验证该生产调用链。
- 置信度：high

## 覆盖情况

- 已检查：选中 Change、`client/packages/device-discovery/src/index.ts`、`test/device-discovery.test.mjs` 的未暂存差异与完整当前内容。
- 已验证：`mise exec -- pnpm test -- device-discovery`，2 项通过。
- 未验证：桌面适配器实际调用链与接收器硬件验收；硬件验收保持 blocked，且由人工硬件负责人处理。

## 结论

findings。最小下一步是在获授权的实现切片中补齐桌面适配器到 `projectDeviceEvent` 的直接接线，并进行调用链验证。