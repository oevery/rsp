# Skills 与 managed work

RSP 发布十一项默认、宿主无关、按需加载的 lifecycle Skills。每项 Skill 都有狭窄的 authority boundary，并把结果返回已有项目或 RSP owner。

| Skill | 职责 |
|---|---|
| `rsp` | 派生 next action，指导 setup、durable review 与 archive 判断。 |
| `rsp-shape` | 塑造一个 executable Change 或合理的 shallow Group。 |
| `rsp-design` | 解决一个 bounded domain、module/seam 或 evidence-seeking design 问题。 |
| `rsp-implement` | 实现一个 selected ready Change，并提供 fresh verification。 |
| `rsp-diagnose` | 在修正前确认原因，或如实返回 unresolved diagnosis。 |
| `rsp-tdd` | 让一个合理的 behavior 经过 RED、GREEN 与安全 REFACTOR。 |
| `rsp-review` | 对固定 Code、Document 或 mixed comparison 做只读审查。 |
| `rsp-resolve-findings` | 处置 fixed findings，修正 accepted 项，验证并请求复审。 |
| `rsp-commit` | 创建一个已授权、exact-scope local commit。 |
| `rsp-release-docs` | 起草、审计、定稿或校准显式 release documentation surface。 |
| `rsp-manage` | 协调符合条件的 long-running、recovery 或 multi-slice continuation。 |

`rsp-structural-audit` 是可选的 report-only project Skill，在实现权限授予前审计一个 bounded repository 或 subtree。

## 按证据组合套件

- Shape 建立 executable owner。
- Design 回答一个实质性问题并返回该 owner。
- Failure 原因不明时 Diagnose 优先于 TDD。
- 仅在显式要求，或具体 changed risk 使 pre-mutation RED 明显更安全时选择 TDD。
- Review 保持只读；Resolve Findings 拥有 accepted correction。
- Release Docs 要求显式确认的 release operation。
- 任何 Skill 都不推断 commit、push、publication、deployment、approval 或 human-acceptance 权限。

## Managed automation

Manage 是符合条件的 long-running、recovery、multi-slice、repeated-convergence、real-host acceptance 或 lifecycle delivery 工作的 controller。Direct one-step 和 small tightly coupled work 保持直接执行。

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 控制选择：

- `explicit`：仅在明确请求时选择 Manage。
- `auto`：Core 可以为符合条件且已请求完成或继续的工作选择 Manage。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的上限：

- `manual`：archive 与 commit 都保持手动。
- `lifecycle`：durable review 后可以 archive；commit 仍然独立。
- `local`：允许 lifecycle closeout，并在符合条件、clean、已验证、非小型终态边界执行一次有独立依据的 local commit。

配置永远不授予 planning、product mutation、lifecycle、Git、publication、approval 或 human-acceptance 权限。Push、tag、release、deployment 与 external action 始终保持显式。

Managed interruption 与 resume 不创建持久化 controller 或 paused state。Pause 会停止 active work，但保留 focused WorkRef；resume 在重新判断资格前重读 authority、status、diff、blockers 与 verification。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
