# 配置参考

项目配置位于 `.rsp/config.yaml`。`rsp init` 会生成完整的默认配置；`rsp update` 只回填缺失的默认字段，不覆盖已有自定义值。配置永远不会扩展权限。

## Change 类型

空列表使用内置 Change 类型：`feature`、`fix`、`refactor`、`docs`、`ops` 与 `research`。非空配置列表会替换而不是扩展默认值，每个条目必须是唯一的非空字符串。

```yaml
kinds:
  - feature
  - fix
  - docs
```

默认配置会写成 `kinds: []`。

## 持久化语言

```yaml
language:
  default: en
  artifacts: zh-CN
  commit: en
```

`language.default` 为持久化产物与提交说明提供默认值；可选的 `artifacts` 和 `commit` 覆盖相应内容。值使用规范化的 BCP 47 语言标签。

回复语言仍由用户和会话决定，不能通过 `language.response` 配置。已有产物保持既有语言，除非明确授权翻译。规范标题、命令、路径、标识符、Conventional Commit 类型与作用域、尾注、机器值和 WorkRefs 不本地化。

RSP 不提供 WorkRef 语言或风格配置字段。`language.default: zh-CN` 可以选择中文 Change 正文，但不会选择中文 WorkRef。当用户没有显式提供标识，最近的项目或领域也没有命名约定时，推断出的 WorkRef 默认使用 ASCII 小写 kebab-case。显式提供或项目约定选择的有效 Unicode WorkRef 仍然受支持并保持不变。

## 读取有效配置

使用 `rsp config` 查看简洁的有效项目配置，使用 `rsp config --json` 获取自动化读取的有效配置摘要；需要单行结果时可追加 `--compact`。命令形式仍只有 `config` 和 `config --json` 两个入口，`--compact` 只是后者的输出格式选项。该命令只读取并校验 `.rsp/config.yaml`，不会扫描 Changes、focus、依赖图、归档或 Git 状态。

JSON 返回 Change 类型、Decision Records 路径、Manage 策略和持久化语言的单层有效摘要。例如仅配置 `language.default: zh-CN` 时，输出中的 `language.artifacts` 和 `language.commit` 都是 `zh-CN`。

Agent 仅在当前决定依赖有效 RSP 配置时，使用同一选定 CLI 成功返回的 `rsp config --json` 摘要。CLI 负责校验、默认值与继承解析，Agent 负责解释结果。相关事实未变时可复用；配置漂移、恢复或依赖配置的收尾前重新读取，不必每个阶段都读取。原始 YAML 只用于诊断，status 也不是配置摘要。

无效配置以非零退出码返回错误，不提供有效摘要。投影失败或选定 CLI 不可用时，应诊断原因，不绕过校验或手算默认值。依赖配置的决定与自动收尾保持不可用；不依赖未解析配置的独立授权工作可以继续。显式语言覆盖和已有文件语言仍然有效。其他工具的配置保留各自的读取方式。

## Decision Records

Decision Records 默认位于 `.rsp/specs/decisions/`。如果宿主项目已在其他位置拥有 ADR，只配置一个项目相对的权威目录：

```yaml
decisions:
  path: docs/adr
```

该路径不能是绝对路径、不能逃逸宿主项目，也不能指向其他 `.rsp/` 核心位置。切换路径不会迁移已有记录。在项目迁移或明确删除旧记录前，`rsp doctor` 会报告遗留在默认目录的非活动记录。

## Manage 策略

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` 接受 `explicit` 或 `auto`。Core 仅在有可观察的耦合切片、恢复、独立验收、共享资源、审查收敛或交付／生命周期协调义务时，才为其内部按需协调分支判断资格；文件数量与普通连续工作本身不构成资格。需要持久归属的协调先解析 ready Change 或 Group；纯只读设计／诊断不制造 owner。选择 Skill 不等于委派 worker。激活不授予规划、产品修改、生命周期或外部权限。

`closeout` 接受：

- `manual`：不自动归档或提交。
- `lifecycle`：所需固定范围审查干净且持久化写回判断完成后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

省略 `manage` 时，兼容默认值仍为 `activation: explicit` 与 `closeout: local`。只有真实合格且已选择的协调分支，通过最新门禁后才可考虑既有的有限生命周期／本地 Git 收尾上限；普通工作不因此获得归档或提交权限。更近的禁止与宿主限制优先。RSP 不提供 `full` 预设；推送、标签、发布、部署、批准与人工验收保持显式。

选择行为见 [Skills 与受管工作](../guides/skills.md)。
