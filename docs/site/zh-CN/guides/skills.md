# Skills 与受管工作

当前源码候选定义八项与宿主无关的默认 Skill，供按需加载；它尚未作为版本发布，也未完成行为验收，已发布稳定包仍以自身清单为准。每项 Skill 有明确的权限边界；普通会话工作不必制造 Change。

| Skill | 职责 |
|---|---|
| `rsp` | 选择当前分支；让普通已授权工作完成检查和必要写回，符合条件时才协调。 |
| `rsp-shape` | 回答有界只读设计问题，或在规划获授权时塑造可执行 Change／浅层 Group。 |
| `rsp-implement` | 按需只读诊断；实现已授权修正，在有理由时测试先行，按固定发现修正并作最新检查。 |
| `rsp-doc` | 面向明确读者与任务，编写或较大范围修订已授权的仓库文档。 |
| `rsp-verify` | 针对已选 WorkOwner 声明的证据边界执行一次有界、只读验证。 |
| `rsp-review` | 对固定的代码、文档或混合比较范围做只读审查。 |
| `rsp-commit` | 创建一个已授权、范围精确的本地提交。 |
| `rsp-release-docs` | 起草、审计、定稿或校准明确的发布文档范围。 |

`rsp-structural-audit` 是可选的纯报告项目 Skill，在授予实现权限前审计一个边界明确的仓库或子树。

使用所选候选 CLI 执行不带名称的 `rsp skills install` 时，默认包含 `rsp-doc`；仍可用 `rsp skills install rsp-doc` 单独安装，指定任意 Skill 名称时只安装所选项。Doc 只在较大范围、已授权的 README、CONTEXT、Spec 和技术指南编写时按需加载，不接管只读 Review、Shape 决策、Release Docs 或维护者 Skill 编写。小范围修改仍可直接完成，部分安装或旧安装缺少 Doc 时保留有界写作 fallback。

## 旧 Skill 名称迁移

对此尚未发布的源码候选，将 `rsp-design` 交给 `rsp-shape`；将 `rsp-diagnose`、`rsp-tdd`、`rsp-resolve-findings` 作为 `rsp-implement` 的按需方法；将 `rsp-manage` 作为 `rsp` 内部的按需协调。更早的 `rsp-address-review` 别名也归 `rsp-implement`。这是职责映射，不是永久兼容 Skill，更不是要求删除项目自有说明。

待精确候选 CLI 可用后，全程使用同一个已选候选 CLI；`@latest` 不代表此未发布候选。先查看 `rsp skills list`，并用 `rsp skills install --dry-run` 预检。已选 Skill 树内容不一致或存在已识别的过时包自有名称时，普通 dry-run 会直接报错，不会展示完整的替换／移除结果。先检查并备份用户定制内容，再用同一个 CLI 运行 `rsp skills install --dry-run --force`，查看明确的替换／删除范围；确认后才用该 CLI 运行 `rsp skills install --force`。未知 Skill 保持不动。安装器对已识别的替换／移除在激活失败时回滚，但这不意味着静默更新安全。`rsp update` 不刷新 Skills。这里不声称候选已有版本、发布、外部安装或行为验收。

安装方式、运行时角色和调用方式彼此独立：

| Skills | 分发方式 | 运行时角色 | 调用方式 |
|---|---|---|---|
| `rsp` | 默认 | Core | 直接作为项目入口 |
| `rsp-shape` | 默认 | Shape | 由 Core 路由，或显式请求塑形 |
| Implement、Verify、Review 与 Release Docs | 默认 | Discipline | 由 Core 路由为专门能力，或接受边界明确的显式请求 |
| `rsp-commit` | 默认 | 本地交付 Discipline | 精确边界显式授权；合格协调收尾还须通过自身门禁 |
| `rsp` 的按需协调 | Core 内部 | 协调分支 | 仅在有效项目策略下存在真实协调义务时选择 |
| `rsp-structural-audit` | 可选 | Discovery | 显式纯报告请求 |
| `rsp-doc` | 默认 | 写作 Discipline | 较大范围、已授权的仓库文档编写 |

“默认”表示属于本源码候选的默认套件，不表示自动调用。Skill 边界不等于 worker 边界。Core 通过资格判断后才可按需组合有界 worker；进入协调分支本身不代表委派。发布的 Skill 保持独立可用；缺少可选兄弟 Skill 时保留有界安全 fallback。

## 按证据组合套件

- Shape 可只读回答一个有界设计问题，无需制造 WorkRef 或计划；规划写回需独立授权及实际归属。
- Implement 在修正不明失败前先调查原因；纯诊断保持只读，无需制造 owner。已授权的修正从已确认原因出发，在同一权限和范围内继续；仅在显式要求或具体风险支持时先运行 RED。
- Implement 对固定发现逐条给出接受、拒绝或需澄清的处置，在权限内修正已接受项，重跑受影响检查，并交由独立只读 Review 复审；不得自行宣称 review-clean。
- Verify 在需要时执行已声明的只读证据边界，普通 Implement 检查不必转 Verify。Change 使用 WorkRef 与 `Verify` 边界；Group 使用 Brief 中命名的 `Integration:` 条件。临时边界必须在 Group closeout 前写回；要求独立验收时需要宿主证明不同 worker。
- Review 保持固定范围和只读；Release Docs 需要明确的发布文档请求，但不因此获得发布权限。
- Doc 与文档审查使用相同的语义质量维度：Purpose（读者目标）、Grounding（事实依据）、Usability（可理解与可使用）、Ownership（归属）、Maintenance（可维护性）。Doc 据此写作和自检，Review 据此发现有实际影响的阅读障碍或错误承诺，保持只读。合格的非标准结构可以不改；两个包独立可用，不互相构成必经阶段。
- 执行位置选择和跨分支集成由宿主、用户与 Git 负责。Core 的按需协调分支只在实际观察到的 checkout 或环境中工作；不存在负责选择或回迁执行环境的规范 Skill。
- Commit 只负责当前 checkout 中一个边界精确的本地提交，不吸收 cherry-pick、cleanup 或跨分支集成。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 控制结果

Core 从意图、权限、现有归属和 checkout 证据选择分支，然后只加载相应方法。普通单 owner 工作在同一次授权请求中完成相称检查与必要写回，不要求再次说 `continue`；简单会话任务无需制造 Change，也不因此获得归档或提交权限。同范围同权限的方法切换及可修复失败留在负责的能力内；只有职责完成、目标／owner／范围／权限变化、真实跨职责独立验收或无法在范围内解决的 blocker 才返回 Core。返回 Core 本身也不要求用户再次发话。不持久化 route、controller 状态或第二本台账。

工作归属、决策归属、临时交接、执行不确定性与验收是不同概念。`WorkOwner` 表示选定的 Change 或浅层 Group，`DecisionOwner` 表示必须作出实质决策的人或权限来源，`NextOwner` 表示下一个控制或执行能力。每次停止都必须说明下一位 owner、所需输入，以及工作应经 Shape 或 Core 返回，还是等待新的证据、环境、验证或能力。必需 worker 未实际创建、没有 worker-authored result，或在要求时没有 Host attribution 时，只能视为能力不可用，绝不能视为成功完成。

三个容易混淆的门槛彼此独立：

- 实现验证（implementation verification）在每次修改后提供最新证据。
- 固定范围变更审查（fixed-scope change review）是 Review 拥有的只读比较；仅在用户显式请求、项目权限或风险要求，或受管流程需要推导 `review-clean` 时才是必需项，不会自动施加给每个 tiny direct 操作。
- 持久化写回判断（durable writeback decision）在归档前必做，并独立判断是否要把稳定现状或长期理由更新到 Spec、范围明确的指令或 Decision Record；它不能替代固定范围变更审查。

这些结果只存在于当前响应与宿主执行上下文中。Change 和 Group 仍是持久归属者，其生命周期仍只有 `open` 或 `archived`。

## 受管自动化

Core 的按需协调分支只处理真实的耦合切片、恢复、执行与验收 owner 分离、共享验证资源、有界 Review 收敛、受管 lifecycle 或交付协调。文件数量、公开文档与普通的顺序方法切换本身不构成资格。这个分支不是另一个 controller，也不会自动产生 worker 边界。

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` 控制选择方式：

- `explicit`：按需协调需要明确请求。
- `auto`：只有当前证据显示真实协调义务时 Core 才选择该分支；否则普通工作在同一请求中继续。

协调需要持久归属时，Core 先解析选中的 Change 或浅层 Group，再按有效 activation 和权限选中或拒绝分支。纯设计／诊断的只读请求不能凭空制造归属；规划需独立授权。进入分支后 Core 检查 owner 与 diff 漂移，同范围的方法与可恢复失败留在内部处理。目标、owner、范围、权限、独立验收或未解决 blocker 变化时重新派生；仅仅跨越阶段不要求用户说继续。

协调时 Core 根据依赖、修改边界、验证资源及 Host 能力选择临时串行或并行策略。worker 参与必须由宿主实际证明，不能从 Skill 路由推断；共享资源除非宿主证明隔离安全，否则保持串行。独立 Verify 要求不同 worker 的证据。

纯诊断与检查保持只读；已授权修正拥有其修改边界。缺少必需的宿主归属证明或已接受证据时停止，不能模拟独立性。

`closeout` 保留既有兼容值，只在协调分支实际通过资格判断且被选择后设置收尾上限；普通工作不从该配置获得归档或提交权限：

- `manual`：归档与提交都保持手动。
- `lifecycle`：所需固定范围变更审查干净且持久化写回判断完成后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

合格的协调分支推导符合条件的交付请求；rsp-commit 独占 owner 重校验、精确暂存、message 构造、一次本地提交和提交后观察。

`activation` 永远不授予规划或产品修改权限。仅对当前合格且已选择的协调分支，`closeout` 保持上述通过最新门禁后的有限生命周期／本地 Git 权限上限；更近的禁止优先。推送、标签、发布、部署、批准、人工验收及其他外部操作始终需要显式授权。

受管工作的中断与恢复会重新检查已接受状态、权限、diff 与证据。取消、heartbeat、重放安全和资源释放由 Host 负责；RSP 不持久化 controller 或暂停状态。

选中的协调分支可在 marker 中保存稀疏的已接受状态 Focus Capsule 作为恢复指针。它是有界指针，不具备权限，也不包含 worker 或运行时数据；跨设备使用需要单独授权的 Git 传输并重新派生状态，unfocus 或 archive 会删除它。

精确键见[配置](../reference/configuration.md)，普通操作见[日常工作流](./daily-workflow.md)。
