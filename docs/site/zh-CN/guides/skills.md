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

## 控制结果

RSP 使用临时的 Skill Control Model 解释当前决策，但不会创建持久化控制器状态。Core 在同级路径中选择一种：专门 Discipline、受限直接执行、受管执行、返回 Shape，或停止。直接执行必须始终满足一个 ready owner、一个本地 seam、一次修改、一个决定性检查、不需要受管生命周期协调且没有 ready successor；边界一旦扩大，Core 就重新推导路由。

归属问题、执行不确定性与验收属于不同阶段。每次停止都必须说明下一位 owner、所需输入，以及工作应通过 Intake 恢复、经 Shape 返回、由 Core 重新路由，还是等待新的证据、环境、验证或能力。必需 worker 未实际创建或没有有效 receipt 时，只能视为能力不可用，绝不能视为成功完成。所有必需结果都具备最新有效证据前，验收保持 incomplete；只有 durable review 干净后，才能进一步推导 lifecycle 或 local commit 资格。

这些结果只存在于当前响应与宿主执行上下文中。Change 和 Group 仍是持久归属者，其生命周期仍只有 `open` 或 `archived`。

## 受管自动化

Manage 是符合条件的长时间运行、恢复、多切片、反复收敛、真实宿主验收或生命周期交付工作的控制器。单步工作和紧密耦合的小型工作保持直接执行。

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 控制选择方式：

- `explicit`：仅在明确请求时选择 Manage。
- `auto`：在保留 Review、发布、隔离 Design 与完整小工作例外后，Core（核心协议）会让其他已请求完成或继续的工作先进入不修改状态的 Manage Intake。

Intake 只返回一种归属结果：`ready`、`needs-shape`、`needs-owner` 或 `out-of-goal`。它不会切换其他归属、派发工作，也不会修改规划或产品文件。返回 Shape 有两条不同路径：Intake `needs-shape` 会把尚未解决的归属问题交给 Shape，而已通过资格判断的受管 frontier 出现 `fog` 时会返回 `StopDisposition: return-to-shape`。两种情况下，Shape 都把 ready owner 返回 Core，由 Core 重新推导路由；Manage 绝不从 Shape 直接恢复。只有最新 Intake 再次得到 `ready` 后，才能进入受管执行。

受管执行会按失败关闭顺序把新出现的不确定性分类为超出目标、归属者决策、尚不可精确描述的 fog、需要事实证据，或可执行。每个临时 worker packet 都固定 WorkRef、lane 目标、当前假设与证据、允许路径/动作/命令、禁止动作、比较基线、结果 schema 和停止条件。Token 数量或限制永远不参与派发、路由、权限、完成或验收判断。

Diagnose 与私有 Inspect lane 保持只读；Fix 是其修改边界内的唯一写入者。只有能够确认 Verify 使用了不同于 Fix 的 worker identity 时，才可声称独立验证；否则 Manage 必须报告 independence unavailable，不能把普通只读验证表述为独立验证。可选证据工作不能消耗当前 Fix/Verify 验收路径已需要的派发容量；只有剩余容量仍能形成决定性验收证据时，才可启动 corrective retry。lane 状态、packet、receipt、计数与过程时间线始终保持临时。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的收尾上限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：持久化审查后可以归档；提交仍然独立。
- `local`：允许生命周期收尾，并在符合条件、工作树干净、已验证、非小型终态边界执行一次有独立依据的本地提交。

`activation` 永远不授予规划或产品修改权限。对于当前已选择且通过资格判断的 Manage，`closeout` 仅作为上述自动生命周期/本地 Git 权限上限，且更近的限制仍可收窄它。推送、标签、发布、部署、批准、人工验收及其他外部操作始终需要显式授权。

受管工作的中断与恢复不会创建持久化控制器或暂停状态。暂停会停止进行中的工作，但保留聚焦的 WorkRef；恢复会在重新判断资格前重读权限、状态、差异、阻塞项与验证结果。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
