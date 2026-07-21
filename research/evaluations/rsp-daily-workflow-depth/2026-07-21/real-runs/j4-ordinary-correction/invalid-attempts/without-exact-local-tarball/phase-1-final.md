已停止在 RED 阶段，未修改生产代码。

- 新增聚焦回归测试：同一 `type` 的不同 `classId` 必须互相隔离。
- 已执行精确命令：`mise exec -- pnpm test -- cache-isolation`。
- 结果为非预期 RED：`node --test` 无法运行现有 Vitest 的 `it` 导入，测试在断言前失败，未能证明 cache isolation regression。
- 已如实更新同一 Change 的 Tasks、Verify 与 Blockers：[cache-isolation.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j4-ordinary-correction-DFzXwo/.rsp/changes/cache-isolation.md)。
- 已审查 selected-change diff，未发现本次新增测试或 Change 记录的额外问题；`git diff --check` 通过。
- 未进行 GREEN、未做 authenticated acceptance（不可用且由人工负责）、未 commit/push/publish。

下一步：修复或获得授权修复测试运行器基线后，重新运行同一精确命令建立预期的断言 RED，再实施最小 key 修正。