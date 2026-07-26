## 审查范围

- 比较基准：`HEAD` 与工作区的限定路径 diff
- 意图来源：`.rsp/changes/device-discovery-boundary.md`、`client/AGENTS.md`、`client/CONTEXT.md`
- 代码：issues_found
- 文档：skipped
- 排除项：其他路径；选中 Change 未产生当前 diff

## 发现

### [P1] 归一化边界未接入生产调用链

- 工件类别：code
- 审查维度：生产可达性
- 位置：`client/packages/device-discovery/src/index.ts:6`
- 权威依据：Change 的“Consumer obligations”要求桌面适配器在跨越 runtime 边界前对每条原始记录调用 `projectDeviceEvent`。
- 证据：明确执行 `git diff --no-ext-diff -- .rsp/focus.d/device-discovery-boundary client/packages/device-discovery/src/index.ts test/device-discovery.test.mjs`；随后检索 `projectDeviceEvent`，唯一调用方为 `test/device-discovery.test.mjs:8,14,19`，不存在生产调用方。
- 影响：桌面适配器产生的原始记录不会经过 trim、空值拒绝和冻结投影；Change 声明的边界契约在实际 runtime 路径中未生效。
- 建议操作：由桌面适配器所有者在每条原始记录跨越 runtime 边界前调用该函数，并补充覆盖该生产路径的验证。
- 置信度：high

## 覆盖情况

- 已检查限定 diff、选中 Change、客户端边界权威文件、`projectDeviceEvent` 的全量直接引用，以及前后公开失败行为。
- `mise exec -- pnpm test -- device-discovery` 通过：3 项测试通过。
- 测试证明模块行为与失败契约正确，但不能证明桌面生产调用链已接入。
- 接收器硬件不可用，硬件验收仍为 blocked，未声称通过。

## 结论

发现 1 项 P1：先接入桌面生产调用链，再进行后续审查。