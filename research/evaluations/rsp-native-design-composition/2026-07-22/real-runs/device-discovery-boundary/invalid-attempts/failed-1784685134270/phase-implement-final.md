已完成最小边界实现、只读 review 与授权的架构事实写入。

- 实现 `projectDeviceEvent`：修剪 id、拒绝空 id、保留 `connected`，返回冻结的类型化记录。[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-N3ighP/client/packages/device-discovery/src/index.ts:1)
- 只读 review：`clean`，未发现需修复问题；fixture 没有生产桌面适配器调用链，未将单元测试误称为生产接入验证。
- 架构事实已写入：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-N3ighP/docs/architecture/device-discovery-boundary.md:1)
- 同一 Change 已更新任务、测试证据与硬件 blocker。[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-N3ighP/.rsp/changes/device-discovery-boundary.md:25)

验证通过：

`mise exec -- pnpm test -- device-discovery`：2/2 通过。
`npx --no-install rsp check --focused`：通过。
`git diff --check`：通过。

接收器硬件仍不可用，硬件验收未执行，且仍由人工负责；未暂存、提交、推送或进行其他 Git 生命周期操作。

## Durable Decision
- Current facts: Create a new durable spec
- Current-fact target: `docs/architecture/device-discovery-boundary.md`
- Facts to write:
  - 桌面运行时拥有物理接收器发现与连接生命周期；共享包只拥有纯投影边界。
  - 依赖从桌面适配器流向 `device-discovery`，Web 不得访问接收器 API。
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none
- Archive ready: no
