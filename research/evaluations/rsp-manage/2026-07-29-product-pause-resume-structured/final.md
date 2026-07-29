WorkRef: `normalize-checkpoint`
Authority: 仅 `src/checkpoint.mjs`、`test/checkpoint.test.mjs` 和 `.rsp/changes/normalize-checkpoint.md`。
Current state: 已完成规范化实现，焦点仍为 `normalize-checkpoint`；`rsp status --json` 在此环境不可用，已以焦点与 Change 持久化状态复核。
Changed artifacts: `src/checkpoint.mjs`、`.rsp/changes/normalize-checkpoint.md`。
Fresh verification: `npm test` 通过（1/1）；`git diff --check` 通过。
Blockers: 无可用 receiver device，尚未执行人工接收端验收。
Next action: 在可用接收端设备上完成手工验收后，再决定后续生命周期操作。
Recovery evidence: handoff-pointer authority-reread status-reread focus-reread diff-inspected blockers-reread evidence-refreshed manage-requalified
