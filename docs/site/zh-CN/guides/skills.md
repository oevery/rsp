# Skills 与受管工作

RSP 发布十一项默认、与宿主无关、按需加载的生命周期 Skills。每项 Skill 都有明确且狭窄的权限边界，并把结果返回已有的项目或 RSP 归属位置。

| Skill | 职责 |
|---|---|
| `rsp` | 派生下一步操作，指导接入、持久化审查与归档判断。 |
| `rsp-shape` | 塑造一个可执行 Change 或合理的浅层 Group。 |
| `rsp-design` | 解决一个边界明确的领域、模块或接缝设计问题，或一个以寻找证据为目的的设计问题。 |
| `rsp-implement` | 实现一个已选定且就绪的 Change，并提供最新验证。 |
| `rsp-diagnose` | 在修正前确认原因，或如实返回尚未解决的诊断。 |
| `rsp-tdd` | 让一个合理的行为经过 RED、GREEN 与安全的 REFACTOR。 |
| `rsp-review` | 对固定的代码、文档或混合比较范围做只读审查。 |
| `rsp-resolve-findings` | 处置固定的审查发现，修正已接受的项目，验证并请求复审。 |
| `rsp-commit` | 创建一个已授权、范围精确的本地提交。 |
| `rsp-release-docs` | 起草、审计、定稿或校准明确的发布文档范围。 |
| `rsp-manage` | 协调符合条件的长时间运行、恢复或多切片延续工作。 |

`rsp-structural-audit` 是可选的纯报告项目 Skill，在授予实现权限前审计一个边界明确的仓库或子树。

## 按证据组合套件

- Shape 建立可执行的归属位置。
- Design 回答一个实质性问题并返回该归属位置。
- 失败原因不明时，Diagnose 优先于 TDD。
- 仅在显式要求，或具体的变更风险使修改前的 RED 明显更安全时选择 TDD。
- Review 保持只读；Resolve Findings 拥有已接受修正的修改权限。
- Release Docs 要求显式确认的发布操作。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 受管自动化

Manage 是符合条件的长时间运行、恢复、多切片、反复收敛、真实宿主验收或生命周期交付工作的控制器。单步工作和紧密耦合的小型工作保持直接执行。

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 控制选择方式：

- `explicit`：仅在明确请求时选择 Manage。
- `auto`：Core（核心协议）可以为符合条件且已请求完成或继续的工作选择 Manage。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的收尾上限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：持久化审查后可以归档；提交仍然独立。
- `local`：允许生命周期收尾，并在符合条件、工作树干净、已验证、非小型终态边界执行一次有独立依据的本地提交。

配置永远不授予规划、产品修改、生命周期、Git、发布、批准或人工验收权限。推送、标签、发布、部署与外部操作始终需要显式授权。

受管工作的中断与恢复不会创建持久化控制器或暂停状态。暂停会停止进行中的工作，但保留聚焦的 WorkRef；恢复会在重新判断资格前重读权限、状态、差异、阻塞项与验证结果。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
