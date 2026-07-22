已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-l9LxQ5/docs/architecture/device-discovery-boundary.md)。

## Durable Decision

- Current facts: Update existing spec or scoped instruction
- Current-fact target: `docs/architecture/device-discovery-boundary.md`
- Facts to write:
  - Desktop 拥有物理发现；runtime-neutral package 仅投影事件，Web 不直接发现硬件。
  - `projectDeviceEvent` 的输入、规范化、空 ID 拒绝和不可变输出契约。
  - 硬件验收仍不可用，真实 adapter 接入时需验证单向调用。
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none
- Archive ready: no

验证：`git diff --check -- docs/architecture/device-discovery-boundary.md` 通过；`mise exec -- pnpm test -- device-discovery` 通过（2/2）。

未修改 Change、代码或测试；未执行硬件验收，仍为人工阻塞项。