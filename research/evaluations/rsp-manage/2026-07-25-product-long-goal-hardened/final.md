已完成 `normalize the complete delivery envelope`：

- 实现并归档 bootstrap、header、retry、summary；关闭 `delivery-envelope` Group。
- `header` 与 `retry` 已按独立路径完成，`summary` 在 header 归档后执行。
- 已创建两次本地恢复检查点：
  - `47b51e6 feat(delivery): bootstrap delivery protocol`
  - `bae0e57 feat(delivery): validate envelope fields`
- 最新验证：`npm test` 通过，6/6；`git diff --check` 通过；RSP 状态无 focus、无 open Change/Group。
- `requirements.md` 与 `unrelated.txt` 未修改。

剩余边界：终态归档与代码变更保留在工作区，未创建额外终态提交；未推送（按授权明确禁止）。

下一步：如需要 Git 交付，另行授权后可审查并提交终态生命周期变更。
