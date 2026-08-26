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
| `rsp-verify` | 针对已选 WorkOwner 声明的证据边界执行一次有界、只读验证。 |
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
- Verify 只执行一个已声明的只读证据边界。Change 使用 WorkRef 和 `Verify` 边界；Group 使用 Group Brief 的 `Completion Conditions` 中明确命名的 `Integration:` 条件。仅由当前请求提供的边界只是临时边界，Group closeout 前必须写回 Group Brief；worker identity、独立性、验收与收尾仍由 Manage 拥有。
- Review 保持只读；Resolve Findings 拥有已接受修正的修改权限。
- Release Docs 要求显式确认的发布操作。
- 执行位置选择和跨分支集成由宿主、用户与 Git 负责。Manage 只在实际观察到的 checkout 或环境中工作；不存在负责选择或回迁执行环境的规范 Skill。
- Commit 只负责当前 checkout 中一个边界精确的本地提交，不吸收 cherry-pick、cleanup 或跨分支集成。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 控制结果

RSP 可以使用 Core 所有的可选响应摘要解释当前进展，而不会创建持久化控制器状态。默认只使用 Work、Phase、Result 或 Stop、Evidence、Next；只有活跃时才加入 Mode、State、Changed、Resume。Work 表示当前 `WorkOwner`：Change 使用其 WorkRef，Group 使用其 Group reference。可选机器 mode 为 solo | delegated | coordinated，可选机器 status 为 running | waiting | completed；State 只是展示字段，不是持久化生命周期状态。route、topology、lane result、acceptance 和 closeout 只作为嵌套细节或门槛，不形成并列状态流。Core 仍在 specialist、direct、managed、Shape 或 stop 中选择一条 route。一个 ready owner、一个 writer、一个 execution phase、一个 integrated decisive check，且没有 recovery、独立 acceptance、受管 lifecycle 或 ready successor 时保持 direct；多个文件或文档表面本身不会改变路由。

工作归属、决策归属、临时交接、执行不确定性与验收是不同概念。`WorkOwner` 表示选定的 Change 或浅层 Group，`DecisionOwner` 表示必须作出实质决策的人或权限来源，`NextOwner` 表示下一个控制或执行能力。每次停止都必须说明下一位 owner、所需输入，以及工作应经 Shape 或 Core 返回，还是等待新的证据、环境、验证或能力。必需 worker 未实际创建、没有 worker-authored result，或在要求时没有 Host attribution 时，只能视为能力不可用，绝不能视为成功完成。

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

Core 先把一个明确的 shape-ready Change 或浅层 Group 解析为 `WorkOwner`，并独占首次 Manage 资格判断及 `selected | declined` 路由结果。Change 使用 WorkRef，Group 使用 Group reference 及其直接子 Change。缺少或未就绪的归属在当前请求已独立授予规划产物权限时直接进入 Shape；`manage.activation: auto` 下，明确且已授权的非 tiny 目标会在 Shape → Core → Manage 后继续，无需用户再次请求；`explicit` 则等待后续明确继续。Manage 一旦被选中，只校验当前 owner 和归属 diff 是否漂移，不重复判断 direct 还是 managed。普通同范围 phase result 留在 Manage 内，并检查实际路径和局部 diff。只有发现或新请求改变已声明行为、验收、公共接口、owner、topology、范围或权限边界，或出现其他失效信号、跨会话恢复、closeout 时，才扩大重读并返回 Core。

受管执行中，Manage 根据依赖、修改边界、验证资源和 Host 能力选择临时的串行或并行策略。它可以委派一个 worker，也可以协调多个独立 worker；Assignment、result、Host observation 与执行策略都保持临时。Manage 在推导验收前校验观察到的结果；独立 Verify 要求不同 worker 的证据。

Diagnose 与私有 Inspect lane 保持只读；Fix 拥有其修改边界。连续性、恢复或独立验证需要时，Manage 使用新的 worker 证据；所需 Host attribution 或已接受证据不可用时停止。

`closeout` 设置 Manage 已被实际选择并通过资格判断后的收尾上限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：所需固定范围变更审查干净且持久化写回判断完成后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

Manage 负责推导 commit kind、时机和 compact delivery request；rsp-commit 负责重新校验 owner、精确暂存、message 构造、一次本地提交和提交后观察。

`activation` 永远不授予规划或产品修改权限。对于当前已选择且通过资格判断的 Manage，`closeout` 仅作为上述自动生命周期/本地 Git 权限上限，且更近的限制仍可收窄它。推送、标签、发布、部署、批准、人工验收及其他外部操作始终需要显式授权。

受管工作的中断与恢复会重新检查已接受状态、权限、diff 与证据。取消、heartbeat、重放安全和资源释放由 Host 负责；RSP 不持久化 controller 或暂停状态。

Manager 可在选中的 marker 中保存稀疏的已接受状态 Focus Capsule 作为恢复指针。它是有界指针，不具备权限，也不包含 worker 或运行时数据；跨设备使用需要单独授权的 Git 传输并重新派生状态，unfocus 或 archive 会删除它。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
