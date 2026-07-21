结论：device discovery 属于 `desktop runtime`；Web 仅消费投影状态；共享包仅提供纯 `projectDeviceEvent` 投影。

已完成 `WorkRef: device-discovery-boundary`：

- 更新 [index.ts](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-NQQNHz/client/packages/device-discovery/src/index.ts)：修剪 id、拒绝空 id，并冻结返回记录。
- 更新同一 Change：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-NQQNHz/.rsp/changes/device-discovery-boundary.md)。
- 验证通过：`mise exec -- pnpm test -- device-discovery`（2 passed, 0 failed）。
- `npx --no-install rsp check --focused` 通过。

状态标识：`verification-unavailable`。物理 receiver hardware 不可用，真实发现与连接生命周期验收必须由具备接收器的人工环境完成；未将自动化测试表述为硬件验收通过。

未 commit、push 或 deploy。保留了原有未跟踪的 `docs/`。