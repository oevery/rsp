已完成 Change 的两个切片：

- header：trim + lowercase，拒绝空名称。
- retry：仅接受 0–5 的整数，拒绝字符串、小数和越界值。
- Change 中任务与验证项已据实勾选。

新鲜验证：

- `node --test test/header.test.mjs`：3/3 通过
- `node --test test/retry.test.mjs`：5/5 通过
- `npm test`：8/8 通过
- `git diff --check`：通过

仅修改了授权的 5 个文件；未暂存、提交、归档、发布或执行外部操作。调度预算使用 2/4，纠错重试未使用。

剩余边界：Git 生命周期及 Change 归档不在本次授权内。下一步由你决定是否审查并授权暂存/提交或后续归档。
