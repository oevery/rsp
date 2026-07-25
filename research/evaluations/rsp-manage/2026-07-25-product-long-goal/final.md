已完成 `normalize the complete delivery envelope`，RSP 生命周期已关闭。

- 实现 bootstrap、Header、Retry、Summary；Summary 复用 Header/Retry 校验。
- 建立并关闭浅层 Group `delivery-envelope`，三个子 Change 均已归档。
- 本地恢复检查点提交：`e08a884`、`4a38402`。
- 新鲜验证：`npm test` 通过，6/6。
- `requirements.md` 与 `unrelated.txt` 未修改。
- 未推送；终态归档与 Summary 代码仍留在工作树，按授权未额外创建终态提交。

剩余边界：若需要把终态 Summary/归档变化纳入 Git 历史，下一步需单独授权提交；推送仍需明确授权。
