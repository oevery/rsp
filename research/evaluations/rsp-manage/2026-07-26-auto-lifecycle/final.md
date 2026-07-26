已完成 `normalize-label` 并按生命周期策略归档。

- 实现：`normalizeLabel` 现在修剪边界空白、转小写并折叠内部空白。[实现文件](<workspace>/src/normalize.mjs:1)
- 复审：F1–F3 均已修复；`review-4.md` 为 clean。
- 验证：各轮指定测试通过，`npm test` 通过（3/3）；RSP 状态已无 focused/open Change。
- 收尾：Change 已归档至 [归档记录](<workspace>/.rsp/archives/2026-07-26_normalize-label.md:1)。

review_passes: 3
re_review: clean
user_continuations: 0
npm test: passed

剩余边界：未暂存、未提交、未推送。
下一步：如需要交付 Git 变更，需单独授权提交。
