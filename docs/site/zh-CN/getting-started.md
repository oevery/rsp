# 五分钟入门

RSP 需要 Node.js 22（`>=22`）。选定一个精确版本；已有项目保留记录的版本，直到获授权迁移。

在目标项目根目录运行接入命令。后续 `rsp` 表示 AGENTS 和 `.rsp/version` 指定的精确调用，或已核验版本一致的可执行文件。仅对新项目解析一次稳定版本：

## 初始化项目

```bash
npm view @oevery/rsp dist-tags.latest
# 把 <version> 替换为已检查的精确版本。
RSP_VERSION='<version>'
npx -y @oevery/rsp@"$RSP_VERSION" init --with-project-setup
```

该命令创建 `.rsp/` 基础结构、确保 `AGENTS.md` 中存在 RSP 入口，并创建 `.rsp/changes/project-setup.md`。填写该 Change 和 `.rsp/specs/design.md`，然后检查接入：

```bash
npx -y @oevery/rsp@"$RSP_VERSION" status
```

确认 `status` 显示预期工作；接入有疑问时使用只读的 `doctor` 诊断。这些结果不建立语义验收，也不授予后续修改权限。

如果除了初始化项目还需要打印最终的 `AGENTS.md` 内容，使用 `init --agents-mode print`。RSP 只拥有 `<!-- rsp:begin -->` 与 `<!-- rsp:end -->` 之间的区块；周围的项目指令仍归项目所有。

## 开始一个变更

```bash
rsp create improve-login "让登录失败信息可供用户采取行动"
rsp focus improve-login
rsp show improve-login
```

Focus 是集合，project-setup 可以与 improve-login 同时聚焦。使用明确名称查看目标；show --focused 只在恰好一个标记时成功。开始该 Change 不要求先归档 setup。

编辑 `.rsp/changes/improve-login.md`，保留规范的 Proposal、Spec、Design、Tasks、Verify 与 Blockers 章节。聚焦标记选择当前工作；仅仅存在于 `changes/` 的未完成 Change 不会自动成为当前目标。

不同规模的跟踪工作都使用同一个按 kind 提示的 Change 模板。不要为每个简单的会话任务创建持久跟踪。

在当前兼容周期内，RSP 继续接受旧的 `rsp create --lite`、`--lite=true` 与 `--lite=false` 形式。它们会输出弃用警告并使用同一套标准 kind-aware 模板，不存在单独的 lite renderer。

没有聚焦的 Change 且用户未提供具体任务时，询问要处理什么，或建议用同一个已选 CLI 的 `rsp create <name>` 创建需要跟踪的工作。简单的当前会话任务默认不应创建 RSP Change，除非确实需要持久跟踪。

## 推进到验收

1. 阅读最近的 `AGENTS.md`、相关上下文、聚焦的 Change，以及实际拥有受影响行为的 Specs 或 Decision Records。
2. 在实现前解决结果、范围、非目标、验收条件或设计中的实质性不确定项。
3. 在明确的修改权限内实现，并建立与风险相称的验证。被测边界和相关输入仍然适用时，复用可追溯的通过证据；运行缺失、失败或已失效的检查。显式重跑要求和必需独立执行仍然有效。
4. 用当前结果更新 Tasks、Verify 和 Blockers，不记录执行流水账。
5. 核实结果事实，把需要更新的稳定知识写回对应归属；写回后收敛整个 Change，检查最终一致性，并完成所需 Review。
6. 获得生命周期权限后，检查 `rsp ready <work-ref> --json`，要求 `completionGate: pass` 和 `archiveReady: yes`，再用 `rsp archive` 归档。Readiness 不能替代验收及前述语义检查。

归档不授予 Git、发布或部署权限。应重新检查工作树，并分别取得这些权限。

## 更新项目

init 已安装全部七个核心 Skills。更新前保存受管资产中需要保留的定制内容，选定一个精确目标，再运行该目标 CLI：

```bash
npx -y @oevery/rsp@"$RSP_VERSION" update
```

这里的 RSP_VERSION 是主动选择的目标，不是每次重新解析的稳定标签。可选的 update --dry-run 只预览，不写入；无需独立安装 Skills、采用版本或删除旧文件的步骤。未知 Skills、用户配置与项目知识保持不动，受管 Skills 内的本地修改会被替换。迁移细节见[固定版本与 Skills](./guides/skills.md#固定版本与-skills-only-迁移)。这些源码契约不证明已经发布。

接下来阅读[核心概念](./concepts.md)，或直接遵循[日常工作流](./guides/daily-workflow.md)。
