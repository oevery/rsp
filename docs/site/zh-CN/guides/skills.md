# Skills 与受管工作

RSP 发布一个由十二项与宿主无关的 Skill 组成的默认套件，供按需加载。每项 Skill 都有明确且狭窄的权限边界，并把结果返回已有的项目或 RSP 归属位置。

| Skill | 职责 |
|---|---|
| `rsp` | 派生下一步操作，指导接入、持久化写回判断与归档判断。 |
| `rsp-shape` | 塑造一个可执行 Change 或合理的浅层 Group。 |
| `rsp-design` | 解决一个边界明确的领域、模块或接缝设计问题，或一个以寻找证据为目的的设计问题。 |
| `rsp-implement` | 实现一个已选定且就绪的 Change，并提供最新验证。 |
| `rsp-diagnose` | 在修正前确认原因，或如实返回尚未解决的诊断。 |
| `rsp-tdd` | 让一个合理的行为经过 RED、GREEN 与安全的 REFACTOR。 |
| `rsp-verify` | 针对已选 Change 声明的证据边界执行一次有界、只读验证。 |
| `rsp-review` | 对固定的代码、文档或混合比较范围做只读审查。 |
| `rsp-resolve-findings` | 处置固定的审查发现，修正已接受的项目，验证并请求复审。 |
| `rsp-commit` | 创建一个已授权、范围精确的本地提交。 |
| `rsp-release-docs` | 起草、审计、定稿或校准明确的发布文档范围。 |
| `rsp-manage` | 协调符合条件的长时间运行、恢复或多切片延续工作。 |

`rsp-structural-audit` 是可选的纯报告项目 Skill，在授予实现权限前审计一个边界明确的仓库或子树。

安装方式、运行时角色和调用方式彼此独立：

| Skills | 分发方式 | 运行时角色 | 调用方式 |
|---|---|---|---|
| `rsp` | 默认 | Core | 直接作为项目入口 |
| `rsp-shape` | 默认 | Shape | 由 Core 路由，或显式请求塑形 |
| Design、Implement、Diagnose、TDD、Verify、Review、Resolve Findings 与 Release Docs | 默认 | Discipline | 由 Core 路由为专门能力，或接受边界明确的显式请求 |
| `rsp-commit` | 默认 | 本地交付 Discipline | 在精确边界获得授权后由 Core 或 Manage 路由 |
| `rsp-manage` | 默认 | Controller | Core 根据显式请求或有效项目策略选择 |
| `rsp-structural-audit` | 可选 | Discovery | 显式纯报告请求 |

“默认”表示随套件安装，并不表示自动调用。普通 Discipline Skill 不递归编排面向用户的流程；只有通过 Core 资格判断的 Manage Controller 才能组合有边界的 worker lanes。

## 按证据组合套件

- Shape 建立可执行的归属位置。
- Design 回答一个实质性问题并返回该归属位置。
- 失败原因不明时，Diagnose 优先于 TDD。
- 仅在显式要求，或具体的变更风险使修改前的 RED 明显更安全时选择 TDD。
- Verify 只执行一个已声明的只读证据边界；worker identity、独立性、验收与收尾仍由 Manage 拥有。
- Review 保持只读；Resolve Findings 拥有已接受修正的修改权限。
- Release Docs 要求显式确认的发布操作。
- 执行位置选择和跨分支集成由宿主、用户与 Git 负责。Manage 只在实际观察到的 checkout 或环境中工作；不存在负责选择或回迁执行环境的规范 Skill。
- Commit 只负责当前 checkout 中一个边界精确的本地提交，不吸收 cherry-pick、cleanup 或跨分支集成。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 控制结果

RSP 使用临时的 Skill Control Model 解释当前决策，但不会创建持久化控制器状态。Core 在同级路径中选择一种：专门 Discipline、受限直接执行、受管执行、返回 Shape，或停止。specialist 路径结束于一个显式且边界明确的 Discipline 结果。direct 路径编排一次非 Manage 的完成或继续过程，可以指定恰好一个 Discipline executor，但不会把它变成 Controller。只有 managed 路径可以组合 worker lanes 和 Review 收敛。一个 ready owner、一个 writer、一个 execution phase、一个 integrated decisive check，且没有 recovery、独立 acceptance、受管 lifecycle 或 ready successor 时保持 direct；多个文件或文档表面本身不会改变路由。Core 只能直接修改 RSP 控制面状态；产品修改由 Implement 或同一边界内的受限手动 Discipline 操作执行。

工作归属、决策归属、临时交接、执行不确定性与验收是不同概念。`WorkOwner` 表示选定的 Change 或浅层 Group，`DecisionOwner` 表示必须作出实质决策的人或权限来源，`NextOwner` 表示下一个控制或执行能力。每次停止都必须说明下一位 owner、所需输入，以及工作应经 Shape 或 Core 返回，还是等待新的证据、环境、验证或能力。必需 worker 未实际创建或没有有效 receipt 时，只能视为能力不可用，绝不能视为成功完成。

三个容易混淆的门槛彼此独立：

- 实现验证（implementation verification）在每次修改后提供最新证据。
- 固定范围变更审查（fixed-scope change review）是 Review 拥有的只读比较；仅在用户显式请求、项目权限或风险要求，或受管流程需要推导 `review-clean` 时才是必需项，不会自动施加给每个 tiny direct 操作。
- 持久化写回判断（durable writeback decision）在归档前必做，并独立判断是否要把稳定现状或长期理由更新到 Spec、范围明确的指令或 Decision Record；它不能替代固定范围变更审查。

这些结果只存在于当前响应与宿主执行上下文中。Change 和 Group 仍是持久归属者，其生命周期仍只有 `open` 或 `archived`。

## 受管自动化

Manage 只处理存在可观察协调义务的工作：独立切片、恢复、不同的执行与验收 owner、真实宿主/provider/hardware 验证、有界 Review 收敛、受管 lifecycle、明确 ready successor，或真实的多阶段权限边界。文件数量、Specs、产品呈现、公开文档和验证文件本身不构成资格信号；但只要真实义务存在，即使工作量较大且必须串行，仍然选择 Manage。

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` 控制选择方式：

- `explicit`：仅在明确请求时选择 Manage。
- `auto`：保留 specialist 路径后，Core（核心协议）先解析 ready owner，只在当前证据存在上述协调义务时选择 Manage；否则继续 direct Core 或 Discipline 路径。

Core 先把一个明确的 shape-ready Change 或浅层 Group 解析为 `WorkOwner`，并独占首次 Manage 资格判断及 `selected | declined` 路由结果。缺少或未就绪的归属在独立规划产物权限下直接进入 Shape；Shape 把 ready WorkOwner 返回 Core 重新路由，绝不直接恢复 Manage。Manage 一旦被选中，只校验 handoff 完整性以及当前 owner、权限和归属差异是否漂移，不重复判断 direct 还是 managed。普通同范围 receipt 只需检查实际路径和局部 diff；正常 Fix 在已声明验收内实现行为时不会触发完整 owner 重读。只有发现或新请求改变已声明行为、验收或公共接口边界，或出现其他失效信号、跨会话恢复、closeout 时，才扩大重读并返回 Core。

受管执行会按失败关闭顺序把新出现的不确定性分类为超出目标、归属者决策、尚不可精确描述的 fog、需要事实证据，或可执行。Manage 会派生临时 `ExecutionFrame` 与最小安全拓扑：`control-action`、纵向复用 worker、顺序 worker、并行 wave、只读 fan-out、有界纠正或独立 Verify。每个 `Assignment` 只携带 WorkRef、目标、精确 authority 引用、Read/Write/Verify 集合、有界已知事实、允许与禁止动作、停止条件和重放安全等级。Worker 通过消息返回包含 result、changed paths、精确 verification、omissions、boundary status、证据有效性与资源释放结果的 `Receipt`，不通过 Focus Capsule 协调。Token 数量、运行时间、轮询次数与进度消息数永远不参与派发、路由、权限、完成或验收判断。

Diagnose 与私有 Inspect lane 保持只读；Fix 是其修改边界内的唯一写入者。只有 owner、角色、seam、策略与 writer 边界仍兼容时，才纵向复用 primary worker；独立调查、策略重置、无关切片与独立 Verify 使用 fresh worker。Manage 通过 `rsp-verify` 的结果契约路由验证，且只有能够确认 Verify 使用了不同于 Fix 的 worker identity 时，才可声称独立验证；否则必须报告 independence unavailable。不再设置整个 managed run 的派发总配额：每次派发都必须服务于必要且有界的 Assignment；同范围 Assignment 失败后默认最多允许三次 correction pass，且在没有新证据或无法收敛时提前停止。独立 Verify 始终是单独的验收义务。frame、session、assignment、receipt、resource lease、计数与过程时间线始终保持临时。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的收尾上限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：所需固定范围变更审查干净且持久化写回判断完成后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

Manage 负责推导 commit 资格、时机和 Commit envelope；`rsp-commit` 独占精确暂存、message 构造、一次本地提交和提交后观察。

`activation` 永远不授予规划或产品修改权限。对于当前已选择且通过资格判断的 Manage，`closeout` 仅作为上述自动生命周期/本地 Git 权限上限，且更近的限制仍可收窄它。推送、标签、发布、部署、批准、人工验收及其他外部操作始终需要显式授权。

受管工作的中断与恢复不会创建持久化控制器或暂停状态。机器 heartbeat 与用户可见进度分离，健康运行的长 worker 或验证不会因为计时器或消息阈值而被取消。显式取消会一直保留独占资源，直到 worker 与其拥有的后台进程确认停止。Assignment 把重放安全声明为 idempotent、inspect-before-repeat 或 non-repeatable；长上下文只有在写回已接受状态并检查 diff 与证据后，才能进行语义 rollover。

Manager 可在选中的 marker 中保存稀疏的已接受状态 Focus Capsule 作为恢复指针，但它不具备权限。可安全提交的 capsule 只包含版本注释以及 `Current`、`Evidence`、`Next` 和例外情况下的 `Resume check`；不得包含 worker identity、进程 handle、本机路径、lease、原始 receipt、日志、重试、拓扑或权限。未归档 Change 的普通中间提交可以包含 marker 与 capsule，但跨设备可用仍需要单独授权的 Git 传输，并重新派生权限、baseline、dirty state、阻塞项、资源与证据有效性。unfocus 或 archive 会删除 marker。验证先运行 lane-local 检查，在 convergence 时运行一次 affected 或 integration gate，并在 closeout 时重新运行 Change 要求的新鲜证据。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
