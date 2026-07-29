# 日常工作流

RSP 根据用户意图、仓库 authority、selected Change、当前证据、verification 与 blockers 派生一个 next action。Stage 是指导，不是持久状态。

## 选择当前工作

```bash
rsp status
rsp focus <work-ref>
rsp show --focused
```

只有 `.rsp/focus.d/` 中的 marker 会选择当前工作。存在多个 focused Changes 时，必须由用户或仓库上下文识别正在操作的目标。对于 grouped work，先阅读 sibling Group Brief，再阅读 selected child。

Mutation 前检查 worktree，并保留无关的 modified、staged 或 untracked work。Focus 与 readiness 不授予 product mutation、Git、lifecycle、publication 或 approval 权限。

## 路由工作

```text
outcome 或 scope 不清楚 → shape
实质性 design 问题 → design
原因不明的 failure → diagnose
显式或具体风险要求 test-first → TDD
证据充分的普通变更 → implement
固定 comparison 请求 → review
accepted findings → resolve findings
显式确认的 release operation → release docs
```

每项能力都返回同一 Change 或现有 repository owner。不要创建第二份计划、workflow state 或 receipt store。

## 保持 Change 与现实同步

- 实现推翻原计划时更新 Proposal、Spec 或 Design。
- 仅在结果存在后勾选 Tasks。
- 在 Verify 中记录 fresh commands、覆盖范围、结果与相关 omissions。
- 把尚未解决的外部或技术约束保留在 Blockers。
- 优先选择成本最低的决定性 verification。仅当新测试保护 observable behavior 或真实 boundary，并带来独立长期信心时才保留。

仅用精确 dependency blocker 指向另一个 executable Change：

```md
- requires `authentication/session-model`: session ownership must land first
```

## 验证与审查

最终相关修改后，运行与 changed risk 成比例的检查。过去的运行结果已经 stale。工具或环境缺失表示 verification unavailable；实际执行发现缺陷表示 failed，二者都不能描述为 passed。

Review 使用固定 comparison scope 并保持只读。在明确 mutation authority 下修正 accepted findings，重跑受影响检查，然后请求 re-review，不要自行宣称 convergence。

## Durable decision 与 archive

Tasks 与必需检查通过且无 blocker 后，分别判断是否需要：

- 更新已有 Spec 或 scoped instruction，或创建新的 durable Spec；
- 为长期理由创建或更新 Decision Record。

然后显式归档：

```bash
rsp ready <work-ref>
rsp archive <work-ref>
```

`rsp ready` 提供 deterministic readiness 与 semantic-review signals，只是 advisory，不是 archive approval。Archive 后重新检查完整目标交付范围。Commit、push、publication、deployment、approval 与 human acceptance 仍是独立权限。

## 恢复

如果后续证据表明原 acceptance 实际未满足，使用明确理由重开相同 identity：

```bash
rsp reopen <work-ref> --reason "<why acceptance remains incomplete>"
```

多个 archive 匹配时，增加精确 `--from .rsp/archives/...` path。Group 已关闭时先重开 Group。真正的新 scope 或独立交付的 correction 使用新 Change。
