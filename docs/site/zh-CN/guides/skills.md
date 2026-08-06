# Skills 与受管工作

RSP 发布一个由十三项与宿主无关的 Skill 组成的默认套件，供按需加载。每项 Skill 都有明确且狭窄的权限边界，并把结果返回已有的项目或 RSP 归属位置。

| Skill | 职责 |
|---|---|
| `rsp` | 派生下一步操作，指导接入、持久化写回判断与归档判断。 |
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
| `rsp-workspace` | 为已选 WorkRef 准备隔离 worktree，通过已有 RSP 契约协调宿主原生执行，并保留可恢复的 activity 状态。 |
| `rsp-land` | 把 RSP workspace 中一个精确且已授权的 commit 列表回迁到记录的本地目标。 |

`rsp-structural-audit` 是可选的纯报告项目 Skill，在授予实现权限前审计一个边界明确的仓库或子树。

安装方式、运行时角色和调用方式彼此独立：

| Skills | 分发方式 | 运行时角色 | 调用方式 |
|---|---|---|---|
| `rsp` | 默认 | Core | 直接作为项目入口 |
| `rsp-shape` | 默认 | Shape | 由 Core 路由，或显式请求塑形 |
| Design、Implement、Diagnose、TDD、Review、Resolve Findings 与 Release Docs | 默认 | Discipline | 由 Core 路由为专门能力，或接受边界明确的显式请求 |
| `rsp-commit` | 默认 | 本地交付 Discipline | 在精确边界获得授权后由 Core 或 Manage 路由 |
| `rsp-manage` | 默认 | Controller | Core 根据显式请求或有效项目策略选择 |
| `rsp-workspace` | 默认 | 执行基础设施 | 隔离具有明确价值时由 Core 或 Manage 选择 |
| `rsp-land` | 默认 | 本地回迁 Discipline | 有明确目标、commit 列表和回迁权限时由 Core 或 Manage 路由 |
| `rsp-structural-audit` | 可选 | Discovery | 显式纯报告请求 |

“默认”表示随套件安装，并不表示自动调用。普通 Discipline Skill 不递归编排面向用户的流程；只有通过 Core 资格判断的 Manage Controller 才能组合有边界的 worker lanes。

## 按证据组合套件

- Shape 建立可执行的归属位置。
- Design 回答一个实质性问题并返回该归属位置。
- 失败原因不明时，Diagnose 优先于 TDD。
- 仅在显式要求，或具体的变更风险使修改前的 RED 明显更安全时选择 TDD。
- Review 保持只读；Resolve Findings 拥有已接受修正的修改权限。
- Release Docs 要求显式确认的发布操作。
- Workspace 隔离只为可执行 WorkRef 选择；普通临时工作保留在当前分支。Workspace Skill 复用调用方已有的控制与结果契约，只追加 workspace 上下文和观察事实，使用宿主原生能力执行，并只把可恢复的 worktree/activity 机械操作留给 CLI。
- Commit 与 Land 保持独立权限；回迁冲突会保留两个 worktree，等待显式恢复。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 控制结果

RSP 使用临时的 Skill Control Model 解释当前决策，但不会创建持久化控制器状态。Core 在同级路径中选择一种：专门 Discipline、受限直接执行、受管执行、返回 Shape，或停止。specialist 路径结束于一个显式且边界明确的 Discipline 结果。direct 路径编排一次非 Manage 的完成或继续过程，可以指定恰好一个 Discipline executor，但不会把它变成 Controller。只有 managed 路径可以组合 worker lanes 和 Review 收敛。直接执行必须始终满足一个 ready owner、一个本地 seam、一次修改、一个决定性检查、不需要受管生命周期协调且没有 ready successor；边界一旦扩大，Core 就重新推导路由。Core 只能直接修改 RSP 控制面状态；产品修改由 Implement 或同一边界内的受限手动 Discipline 操作执行。

工作归属、决策归属、临时交接、执行不确定性与验收是不同概念。`WorkOwner` 表示选定的 Change 或浅层 Group，`DecisionOwner` 表示必须作出实质决策的人或权限来源，`NextOwner` 表示下一个控制或执行能力。每次停止都必须说明下一位 owner、所需输入，以及工作应经 Shape 或 Core 返回，还是等待新的证据、环境、验证或能力。必需 worker 未实际创建或没有有效 receipt 时，只能视为能力不可用，绝不能视为成功完成。

三个容易混淆的门槛彼此独立：

- 实现验证（implementation verification）在每次修改后提供最新证据。
- 固定范围变更审查（fixed-scope change review）是 Review 拥有的只读比较；仅在用户显式请求、项目权限或风险要求，或受管流程需要推导 `review-clean` 时才是必需项，不会自动施加给每个 tiny direct 操作。
- 持久化写回判断（durable writeback decision）在归档前必做，并独立判断是否要把稳定现状或长期理由更新到 Spec、范围明确的指令或 Decision Record；它不能替代固定范围变更审查。

这些结果只存在于当前响应与宿主执行上下文中。Change 和 Group 仍是持久归属者，其生命周期仍只有 `open` 或 `archived`。

## 受管自动化

Manage 是符合条件的长时间运行、恢复、多切片、反复收敛、真实宿主验收或生命周期交付工作的控制器。在自动激活下，一个同时跨越权威 Specs、产品呈现、公开文档和多个验证面的 tracked completion 必须选择 Manage，即使所有修改都由一个 writer 串行完成。真正的单步工作和紧密耦合的小型工作保持直接执行。

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 控制选择方式：

- `explicit`：仅在明确请求时选择 Manage。
- `auto`：在保留 Review、发布、隔离 Design 与完整小工作例外后，Core（核心协议）先解析 ready owner，再对其余非小型完成或继续请求进行 Manage 资格判断。

Core 先把一个明确的 shape-ready Change 或浅层 Group 解析为 `WorkOwner`，并独占首次 Manage 资格判断及 `selected | declined` 路由结果。缺少或未就绪的归属在独立规划产物权限下直接进入 Shape；Shape 把 ready WorkOwner 返回 Core 重新路由，绝不直接恢复 Manage。Manage 一旦被选中，只校验 handoff 完整性以及当前 owner、权限和归属差异是否漂移，不重复判断 direct 还是 managed；随后在内部重新校验同一目标下普通的 Fix、Verify、Review 和 Resolve Findings receipt。只有 owner、拓扑、路由、行为、验收、接口、范围或权限真实变化时才返回 Core。

受管执行会按失败关闭顺序把新出现的不确定性分类为超出目标、归属者决策、尚不可精确描述的 fog、需要事实证据，或可执行。每个临时 worker packet 都固定 WorkRef、lane 目标、当前假设与证据、允许路径/动作/命令、禁止动作、比较基线、结果 schema 和停止条件。Token 数量或限制永远不参与派发、路由、权限、完成或验收判断。

Diagnose 与私有 Inspect lane 保持只读；Fix 是其修改边界内的唯一写入者。只有能够确认 Verify 使用了不同于 Fix 的 worker identity 时，才可声称独立验证；否则 Manage 必须报告 independence unavailable，不能把普通只读验证表述为独立验证。可选证据工作不能消耗当前 Fix/Verify 验收路径已需要的派发容量；只有剩余容量仍能形成决定性验收证据时，才可启动 corrective retry。lane 状态、packet、receipt、计数与过程时间线始终保持临时。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的收尾上限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：所需固定范围变更审查干净且持久化写回判断完成后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

Manage 负责推导 commit 资格、时机和 Commit envelope；`rsp-commit` 独占精确暂存、message 构造、一次本地提交和提交后观察。

`activation` 永远不授予规划或产品修改权限。对于当前已选择且通过资格判断的 Manage，`closeout` 仅作为上述自动生命周期/本地 Git 权限上限，且更近的限制仍可收窄它。推送、标签、发布、部署、批准、人工验收及其他外部操作始终需要显式授权。

受管工作的中断与恢复不会创建持久化控制器或暂停状态。暂停会停止进行中的工作，但保留聚焦的 WorkRef；恢复会重读权限、状态、差异、阻塞项与验证结果，再校验已选择的 handoff，而不重复路由资格判断。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
