已完成最小边界保持切片，WorkRef：`device-discovery-boundary`。

- 归属：device discovery 属于 `desktop runtime`；`client/packages/device-discovery` 仅做无副作用事件投影；Web 仅作 typed presentation projection。
- 修改 [index.ts](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-40apdv/client/packages/device-discovery/src/index.ts)：trim `id`、拒绝空 `id`、返回冻结的不可变投影。
- 已更新同一 Change：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-40apdv/.rsp/changes/device-discovery-boundary.md)。

验证已运行并通过：

`mise exec -- pnpm test -- device-discovery`
状态：`2 passed, 0 failed`

状态：`verification-unavailable`。receiver hardware 不可用，真实接收器发现与连接验收仍为 human owned，未声称通过。未 commit、push 或 deploy；未跟踪的 `docs/architecture/device-discovery-boundary.md` 保持未改动。
