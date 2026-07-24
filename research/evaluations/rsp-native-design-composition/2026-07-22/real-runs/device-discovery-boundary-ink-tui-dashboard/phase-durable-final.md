已写入稳定架构事实：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-M8vCPs/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：No Decision Record needed
- 可归档（Archive ready）：no；Change 仍有未勾选的审查/持久化任务，且接收器硬件验收仍为 unavailable（human owned）。

验证：`git diff --check` 通过。提供的固定范围审查为 clean，且 `mise exec -- pnpm test -- device-discovery` 已通过 2 项测试；未声称硬件验收通过。未修改 Change、代码或测试，也未执行任何 Git 生命周期操作。