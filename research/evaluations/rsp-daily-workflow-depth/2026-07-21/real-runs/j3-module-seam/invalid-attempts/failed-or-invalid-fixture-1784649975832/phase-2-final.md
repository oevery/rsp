结论：device discovery 属于 desktop runtime；Web 仅做类型化展示，`client/packages/device-discovery` 只保留纯投影。

`WorkRef: device-discovery-boundary` 已完成最小边界切片：

- 修改 [index.ts](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-TTUN8B/client/packages/device-discovery/src/index.ts)：trim `id`、拒绝空值、保留 `connected`，并冻结返回对象。
- 修改 [device-discovery.test.mjs](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-TTUN8B/test/device-discovery.test.mjs)：改用与 `node --test` 匹配的 `node:test`，避免原 `vitest` suite 初始化失败。
- 更新同一 Change：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-TTUN8B/.rsp/changes/device-discovery-boundary.md)。

验证已运行且通过：

`mise exec -- pnpm test -- device-discovery`
状态：`2 passed, 0 failed`。

真实 receiver hardware 不可用，因此硬件发现与连接生命周期验收未执行，按要求停止在此边界；Change 为未完成的 `verification-unavailable`，仍需人工真实环境验收。架构文档中的 canonical status `design-ready` 保持不变。未 commit、push 或 deploy。