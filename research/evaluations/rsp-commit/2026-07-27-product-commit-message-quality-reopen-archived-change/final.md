已完成并本地提交。

- 实现名称去空白与空白名称 `TypeError`；补齐对应测试和 Change 验证记录。
- 持久化判断：无需新增 Spec 或 Decision Record；Change 保持 open/focused，未归档。
- 提交：`661880e feat(greeting): normalize greeting names`
  - 含 3 条 outcome/boundary bullets 与 `RSP-WorkRef: add-greeting-format`。
- 新鲜验证：`npm test` 通过（3/3）；`git diff --check` 通过；RSP focused check 有效。
- 工作区已清洁；`origin` 引用仍为 `7576fca…`，未 push 或改动远端。

剩余边界：未执行归档、push、tag 或发布。
下一步：由授权方决定是否对该 open Change 执行归档。
