已完成并归档 `normalize-label`：

- `normalizeLabel` 现在依次 trim、转小写、合并内部空白。
- 固定范围复审已 clean；未改动 tests、reviews、`AGENTS.md` 或 `unrelated.txt`。
- 已完成 RSP archive，焦点已清除。

review_passes: 3
re_review: clean
user_continuations: 0
npm test: passed

验证：三轮指定聚焦测试、`npm test`、`git diff --check` 均通过。

剩余边界：按要求未 commit/push；工作树保留实现与归档变更。
下一步：如需交付 Git 历史，另行明确授权提交。
