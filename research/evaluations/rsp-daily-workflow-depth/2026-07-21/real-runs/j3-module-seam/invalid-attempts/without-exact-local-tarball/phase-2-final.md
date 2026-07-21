WorkRef: `device-discovery-boundary`

结论：device discovery 归属 desktop runtime；Web 只消费类型化投影；runtime-neutral package 仅提供纯 `projectDeviceEvent` 边界。

已完成：

- [client/packages/device-discovery/src/index.ts](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam-kX7pFd/client/packages/device-discovery/src/index.ts)：修剪 id、拒绝空 id、冻结返回投影。
- [test/device-discovery.test.mjs](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam-kX7pFd/test/device-discovery.test.mjs)：改用与 `node --test` 一致的 `node:test` API。
- [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam-kX7pFd/.rsp/changes/device-discovery-boundary.md)：更新 Tasks、Verify 和 receiver 硬件 Blocker。

验证通过：

```sh
mise exec -- pnpm test -- device-discovery
```

结果：`2 passed, 0 failed`；`git diff --check` 通过。

状态：`verification-unavailable`。自动化切片已完成，但 receiver hardware 不可用，真实环境的发现、连接与热插拔验收保持 `unavailable; human owned`，未声称已验收。未 commit、push 或 deploy。