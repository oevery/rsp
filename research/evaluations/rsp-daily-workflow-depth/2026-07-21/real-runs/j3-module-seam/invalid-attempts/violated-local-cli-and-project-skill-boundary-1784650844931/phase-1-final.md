已完成设计决策，WorkRef：`device-discovery-boundary`。

产物：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-40apdv/docs/architecture/device-discovery-boundary.md)

结论：discovery 与连接生命周期归 `desktop runtime`；runtime-neutral package 仅负责纯事件投影；Web 仅消费类型化投影，不能直接发现硬件。

验证：

- `npx -y @oevery/rsp check --focused` 通过。
- `git diff --check` 通过。
- `mise exec -- pnpm test -- device-discovery` 已运行但失败：当前实现尚未 trim `id` 或拒绝空 `id`；本阶段未修复。
- receiver hardware 不可用，真实环境验收未执行且必须停在该边界。

未 commit、push 或 deploy。