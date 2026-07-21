已完成设计文档：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam-kX7pFd/docs/architecture/device-discovery-boundary.md)。

WorkRef：`device-discovery-boundary`

结论：device discovery 归属 desktop runtime；Web 仅消费类型化投影；runtime-neutral package 只负责纯 `projectDeviceEvent` 规范化与校验。

验证：`mise exec -- pnpm test -- device-discovery` 已执行但失败。原因是测试由 `node --test` 运行时直接导入 `vitest` 的 `it`，Vitest 找不到当前 suite；未修改代码或测试，因为本阶段仅设计。真实 Receiver 硬件不可用，按要求停在人工真实环境验收边界。未 commit、push 或 deploy。
