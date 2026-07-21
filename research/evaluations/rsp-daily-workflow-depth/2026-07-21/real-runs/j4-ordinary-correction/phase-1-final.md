已完成 `cache-isolation` 的 RED-GREEN 修复并更新同一 Change。

- 新增跨 class、同 type 的隔离回归测试。
- RED：`class-a` 读取到被 `class-b` 覆盖的 `b`，符合预期 isolation 缺陷。
- GREEN：缓存键改为确定性 `{ classId, type }` 组合键，指定命令通过 2/2。
- 已更新 [.rsp/changes/cache-isolation.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j4-ordinary-correction/j4-ordinary-correction-njxF46/.rsp/changes/cache-isolation.md) 的 Tasks、Verify 与 Blockers。
- 已完成 selected-change diff review：未发现额外问题；`git diff --check` 与 `npx --no-install rsp check --focused` 均通过。

验证执行：

```sh
mise exec -- pnpm test -- cache-isolation
```

authenticated multi-class acceptance 不可用，仍为 human owned blocker；未声称完成。未 commit、push 或 publish。