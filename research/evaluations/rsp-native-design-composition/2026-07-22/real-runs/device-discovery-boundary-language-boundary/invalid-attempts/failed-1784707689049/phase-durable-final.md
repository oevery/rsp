已写入 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-Vt0Va4/docs/architecture/device-discovery-boundary.md)。

## Durable Decision

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - Desktop 拥有物理发现与连接生命周期；runtime-neutral 包仅做纯事件投影。
  - `projectDeviceEvent` 修剪并校验 `id`、保留 `connected`、返回新的冻结对象。
  - 硬件验收仍不可用且由人工负责。
- Decision Record：No Decision Record needed
- Decision Record 目标：N/A
- 写入理由：
  - none
- Archive ready：no

验证：`mise exec -- pnpm test -- device-discovery` 通过，3/3；`git diff --check -- docs/architecture/device-discovery-boundary.md` 无输出。

未修改 Change、代码或测试；未执行 Git 生命周期操作。硬件验收未执行且仍不可用。