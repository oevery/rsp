请由项目的 `domain-modeling` 能力处理后返回 `Change rename-workspace`：

- 未决问题：`Account`、`Tenant` 与 `Workspace` 中，哪个聚合拥有 membership，以及其余术语分别是该聚合的别名、边界，还是独立概念。
- 权威输入：项目指令与 `Change rename-workspace` 的现有 Proposal、Spec、Design。
- 预期输出：现有领域模型/决策记录中的术语定义、聚合边界和 membership 所有权决策，并说明对接口、持久化和验收的影响。
- 允许变更：仅该能力通常维护的领域模型或决策产物；不得实现功能、修改 Change、改变焦点或 Git 状态。
- 返回：携带结论与证据回到同一 `Change rename-workspace`，由 Shape 继续应用 Ready gate。
