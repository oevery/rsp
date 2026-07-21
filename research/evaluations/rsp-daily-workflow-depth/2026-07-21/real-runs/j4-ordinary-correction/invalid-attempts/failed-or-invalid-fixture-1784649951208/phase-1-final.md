已完成最小修复并更新同一 Change。

- RED：`mise exec -- pnpm test -- cache-isolation` 确认 `class-b` 覆盖 `class-a`。
- GREEN：相同命令通过，2/2 tests passed。
- 缓存键改为确定性的 `[classId, type]` 组合键，并新增跨 class 同 type 回归测试。
- 已更新 [.rsp/changes/cache-isolation.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j4-ordinary-correction/j4-ordinary-correction-tDDUKg/.rsp/changes/cache-isolation.md:17) 的 Tasks、Verify 与 Blockers。
- selected-change diff review：Code `clean`；Document `clean`；`git diff --check` 通过，未发现问题。

认证 multi-class acceptance 不可用，已如实保留为 human-owned blocker；在此停止。未 commit、push 或 publish。