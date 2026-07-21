已修复 `cache-isolation`，并完成同一 Change 更新。

- RED：新增跨 class、同 type 隔离测试，确认 `class-a` 读到错误的 `'b'`。
- GREEN：缓存键改为确定性 `{ classId, type }` 复合键。
- 修正测试夹具为 `node:test`，使项目的 `node --test` 脚本可实际执行断言。
- 指定验证已通过：`mise exec -- pnpm test -- cache-isolation`（2 passed）。
- 已执行 `git diff --check` 与 `rsp check --focused`，并审查 selected-change diff：未发现新增问题。
- `.rsp/changes/cache-isolation.md` 已记录任务和验证；authenticated multi-class acceptance 仍不可用、human owned，Change 不可归档。

未执行 commit、push 或 publish。另：为恢复 RSP focus，工具生成了 RSP 初始化/升级元数据及 `AGENTS.md` 的 managed block 更新；这些未提交。