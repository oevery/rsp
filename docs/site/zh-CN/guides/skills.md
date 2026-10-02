# Skills 与受管工作

当前源码候选定义七项与宿主无关的默认 Skill，供按需加载；它尚未作为版本发布，也未完成行为验收，已发布稳定包仍以自身清单为准。每项 Skill 有明确的权限边界；普通会话工作不必制造 Change。

| Skill | 职责 |
|---|---|
| `rsp` | 选择当前分支；让普通已授权工作完成检查和必要写回，符合条件时才协调。 |
| `rsp-shape` | 回答有界只读设计问题，或在规划获授权时塑造可执行 Change／浅层 Group。 |
| `rsp-implement` | 按需只读诊断；实现已授权修正，在有理由时测试先行，按固定发现修正并作最新检查。 |
| `rsp-doc` | 面向明确读者和结果，编写仓库文档、Skill 与发布说明。 |
| `rsp-verify` | 针对已选 WorkOwner 声明的证据边界执行一次有界、只读验证。 |
| `rsp-review` | 对固定的代码、文档或混合比较范围做只读审查，包括发布文档。 |
| `rsp-commit` | 创建一个已授权、范围精确的本地提交。 |

`rsp-structural-audit` 是可选的纯报告项目 Skill，在授予实现权限前审计一个边界明确的仓库或子树。

`rsp-doc` 包含在默认套件中，也可用 `rsp skills install rsp-doc` 单独安装。README、CONTEXT、Spec、Change 与指南按产物类型加载方法；Skill 新建或修订使用 Skill 分支；changelog、release notes、迁移指引及已授权的文档对账使用发布说明分支。Review 仅在评审范围包含发布文档时加载发布检查。两者不控制发布，也不据此宣称发布就绪。小修改仍直接完成。维护者专用 `author-rsp-skills` 仅叠加本仓库的 Change、溯源与验证要求。

## 旧 Skill 名称迁移

对此尚未发布的源码候选，将 `rsp-design` 交给 `rsp-shape`；将 `rsp-diagnose`、`rsp-tdd`、`rsp-resolve-findings` 作为 `rsp-implement` 的按需方法；将 `rsp-manage` 作为 `rsp` 内部的按需协调。更早的 `rsp-address-review` 别名也归 `rsp-implement`。这是职责映射，不是永久兼容 Skill，更不是要求删除项目自有说明。

移除 `rsp-release-docs`：写作归 Doc，固定范围只读检查归 Review。直接安装 Doc 或安装默认套件时，会在替换前检查旧的已安装目录；安装其他单个 Skill 不移除它。显式旧名称调用应改用对应 owner。先备份定制发布说明，再进行已授权的强制迁移。

待精确候选 CLI 可用后，全程使用同一个已选候选 CLI；`@latest` 不代表此未发布候选。获得安装权限后：

1. 查看 `rsp skills list`，并用 `rsp skills install --dry-run` 预检。已选树内容不一致或存在已识别的过时包自有名称时，普通 dry-run 会停止，不展示完整替换／移除预览。
2. 先检查并备份用户定制内容，再用 `rsp skills install --dry-run --force` 查看精确替换／移除范围。未知 Skill 保持不动。
3. 确认范围后，才用同一个 CLI 运行 `rsp skills install --force`，并检查安装后的实际状态。

激活失败会触发已识别替换／移除的回滚。回滚可能不完整，此时命令会报告保留的恢复位置；先检查实际安装树与备份，再决定是否重试或清理。这不意味着静默更新安全。`rsp update` 不刷新 Skills。这里不声称候选已有版本、发布、外部安装或行为验收。

安装方式、运行时角色和调用方式彼此独立：

| Skills | 分发方式 | 运行时角色 | 调用方式 |
|---|---|---|---|
| `rsp` | 默认 | Core | 直接作为项目入口 |
| `rsp-shape` | 默认 | Shape | 由 Core 路由，或显式请求塑形 |
| Implement、Verify 与 Review | 默认 | Discipline | 由 Core 路由为专门能力，或接受边界明确的显式请求 |
| `rsp-commit` | 默认 | 本地交付 Discipline | 精确边界显式授权；合格协调收尾还须通过自身门禁 |
| `rsp` 的按需协调 | Core 内部 | 协调分支 | 仅在有效项目策略下存在真实协调义务时选择 |
| `rsp-structural-audit` | 可选 | Discovery | 显式纯报告请求 |
| `rsp-doc` | 默认 | 写作 Discipline | 仓库文档、Skill 或发布说明写作 |

“默认”表示属于本源码候选的默认套件，不表示自动调用。Skill 边界不等于 worker 边界。Core 通过资格判断后才可按需组合有界 worker；进入协调分支本身不代表委派。发布的 Skill 保持独立可用；缺少可选兄弟 Skill 时保留有界安全 fallback。

## 按证据组合套件

- Shape 可只读回答一个有界设计问题，无需制造 WorkRef 或计划；规划写回需独立授权及实际归属。
- Implement 在修正不明失败前先调查原因；纯诊断保持只读，无需制造 owner。已授权的修正从已确认原因出发，在同一权限和范围内继续；仅在显式要求或具体风险支持时先运行 RED。
- Implement 对固定发现逐条给出接受、拒绝或需澄清的处置，在权限内修正已接受项，重跑受影响检查，并交由独立只读 Review 复审；不得自行宣称 review-clean。
- Verify 在需要时执行已声明的只读证据边界，普通 Implement 检查不必转 Verify。Change 使用 WorkRef 与 `Verify` 边界；Group 使用 Brief 中命名的 `Integration:` 条件。临时边界必须在 Group closeout 前写回；要求独立验收时需要宿主证明不同 worker。
- 发布说明写作使用 Doc，发布文档评审使用 Review；两者只加载适用的方法，保留证据与迁移边界，不因此获得发布权限。
- 没有选定 WorkOwner 的发布检查由 Core 按项目声明的检查处理，不制造 Change，也不把无 owner 请求交给 Verify。需要精确候选、检查所需的范围及实际副作用权限；缺少前提时停止相关检查。必需独立验收与 Git／发布权限仍然独立。
- Doc 与 Review 使用已采纳的写作质量契约：事实有据、信息结构清楚、步骤面向结果、表达简练、符号含义稳定、修订不丢语义。Skill 表格仅用于有重复收益的短固定映射；人类文档按比较或查询任务使用表格。已约定的表达要求属于可审查契约，不是个人口味。
- Doc 负责写作与自检，正式 Review 保持只读。Review 在固定内容范围内，用 Code 检查行为与工具语义，用 Document 检查解释与使用指导。完整 Skill 指令通常需要两者；注释与嵌入示例按实际职责接受相称检查，不按扩展名分类。仅作为权威或证据的读取不扩大被审范围。Review 不授予修复权限，原请求已授权的修正可以继续。静态检查不证明实时行为或独立验收。
- 执行位置选择和跨分支集成由宿主、用户与 Git 负责。Core 的按需协调分支只在实际观察到的 checkout 或环境中工作；不存在负责选择或回迁执行环境的规范 Skill。
- Commit 只负责当前 checkout 中一个边界精确的本地提交，不吸收 cherry-pick、cleanup 或跨分支集成。
- 任何 Skill 都不推断提交、推送、发布、部署、批准或人工验收权限。

## 控制结果

Core 从意图、权限、现有归属和 checkout 证据选择分支，然后只加载相应方法。普通单 owner 工作在同一次授权请求中完成必需及相称检查与必要写回，不要求再次说 `continue`；简单会话任务无需制造 Change，也不因此获得归档或提交权限。

归属能力在目标、范围、权限、权威基线与证据要求不变时选择允许的方法。CLI 和脚本提供确定性诊断与观察，不提供语义批准。方法切换不能免除明确命名的强制命令、必需独立 worker 或受保护的 RSP 操作；副作用检查、恢复与停止条件见[验证与审查](./daily-workflow.md#验证与审查)。职责完成、边界变化、真实跨职责独立验收或无法在范围内解决的 blocker 才返回 Core；返回本身不要求用户再次发话。不持久化 route、controller 状态或第二本台账。

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

有效 Manage 策略通过同一选定 CLI 成功返回的 `rsp config --json` 摘要读取，配置漂移、恢复或依赖配置的收尾前刷新。原始 YAML 与 status 不能替代它。投影失败或不可用时，不进行依赖配置的选择和自动收尾，但不阻止不依赖未解析配置的独立授权工作。默认值、继承与失败处理见[有效配置读取](../reference/configuration.md#读取有效配置)。

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
