## 审查范围

- 比较基准：`HEAD (9f4a0a2194367baffa1355f86aff4f4b230021a5)`；已显式执行 `git diff --no-ext-diff HEAD -- .rsp/changes/device-discovery-boundary.md client/packages/device-discovery/src/index.ts test/device-discovery.test.mjs`
- 意图依据：`client/AGENTS.md`、`client/CONTEXT.md`、`.rsp/changes/device-discovery-boundary.md`
- 代码：issues_found
- 文档：issues_found
- 排除范围：其他工作树文件未审查；接收器硬件验收保持 unavailable（human owned）

## 发现

### [P1] 桌面发现事件未接入声明的投影边界

- 工件类型：cross-artifact
- 审查维度：生产可达性与 Change 一致性
- 位置：`.rsp/changes/device-discovery-boundary.md` 的 `Direction and seam`；`client/packages/device-discovery/src/index.ts:1`
- 依据：Change 要求 desktop discovery 将原始记录传入 `projectDeviceEvent`，且 `client/CONTEXT.md` 要求桌面适配器经该边界投影事件。
- 证据：限定范围内仅测试调用 `projectDeviceEvent`；对 `client` 与 `test` 的直接调用搜索未发现任何生产调用者，当前 `client` 中也没有桌面发现适配器实现。
- 影响：运行时设备事件仍无法实际获得 trim、空 ID 拒绝和冻结保障；当前包级实现不足以兑现 Change 所述的桌面接入边界。
- 建议操作：由 Change 所有者明确二选一：将桌面适配器接入及其验证纳入此 Change，或把设计表述收窄为仅定义尚未接入的纯投影 API。
- 置信度：high

## 覆盖情况

- 已审查 Change、`client/packages/device-discovery/src/index.ts` 和 `test/device-discovery.test.mjs`。
- `test/device-discovery.test.mjs` 与 `HEAD` 相同，仍覆盖新增失败契约；已重新执行 `mise exec -- pnpm test -- device-discovery`，结果为 2 passed。
- 已执行 `git diff --check HEAD --` 限定路径，未发现空白错误。
- 未进行硬件验收，符合已声明的 unavailable 状态。

## 结论

findings。最小后续动作是先由 Change 所有者确认桌面接入是否属于本 Change；在此之前，不应把该投影边界视为已在生产路径生效。