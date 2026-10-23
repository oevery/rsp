# 配置参考

项目配置位于 `.rsp/config.yaml`。`rsp init` 会生成完整的默认配置；`rsp update` 回填缺失的默认字段，并对仅含生成注释的配置刷新注释。自定义值和注释保持不变。配置永远不会扩展权限。

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

JSON 返回 Change 类型、Decision Records 路径、Workflow 策略和持久化语言的单层有效摘要。例如仅配置 `language.default: zh-CN` 时，输出中的 `language.artifacts` 和 `language.commit` 都是 `zh-CN`。

Agent 仅在当前决定依赖有效 RSP 配置时，使用同一选定 CLI 成功返回的 `rsp config --json` 摘要。CLI 负责校验、默认值与继承解析，Agent 负责解释结果。相关事实未变时可复用；配置漂移、恢复或依赖配置的收尾前重新读取，不必每个阶段都读取。原始 YAML 只用于诊断，status 也不是配置摘要。

无效配置以非零退出码返回错误，不提供有效摘要。投影失败或选定 CLI 不可用时，应诊断原因，不绕过校验或手算默认值。依赖配置的决定与自动收尾保持不可用；不依赖未解析配置的独立授权工作可以继续。显式语言覆盖和已有文件语言仍然有效。其他工具的配置保留各自的读取方式。

## Decision Records

Decision Records 默认位于 `.rsp/specs/decisions/`。如果宿主项目已在其他位置拥有 ADR，只配置一个项目相对的权威目录：

```yaml
decisions:
  path: docs/adr
```

该路径不能是绝对路径、不能逃逸宿主项目，也不能指向其他 `.rsp/` 核心位置。切换路径不会迁移已有记录。在项目迁移或明确删除旧记录前，`rsp doctor` 会报告遗留在默认目录的非活动记录。

## Workflow 策略

```yaml
workflow:
  delegation: off
  closeout: ask
```

省略配置时也使用以上默认值。`delegation` 接受 `off` 或 `auto`。off 关闭自动派发；明确的代理请求或必需的独立代理义务仍然有效。启用后，由用户或主代理决定使用零个、一个或多个执行代理，受宿主限制。RSP 不提供数量档位或最大数量配置。Direct／Change／Group 与代理拓扑相互独立。

`closeout` 仅在确定最终交付或明确要求关闭时生效：

- `ask`：准备好交付范围与证据，再询问是否关闭；已有明确授权不重复询问。
- `auto`：最终交付且满足条件时关闭，仍服从更近层级的禁止规则。
- `manual`：只有明确要求关闭时才关闭；否则已获授权的提交可以保持 Change 打开。

普通完成和检查点提交保持 Change 打开。普通提交请求不自动表示最终交付。关闭需要准确记录、必要知识回流、适用的 Required 证据、另行要求的审查和当前 readiness。配置不授予 Git、push 或发布权限。

### 迁移旧 Manage 配置

RSP 4.0 将 `manage.activation/closeout` 及 JSON 的 `manage` 投影替换为 `workflow.delegation/closeout`。旧值不是别名：原 `local` 混合了生命周期与 Git 权限，新策略不授予 Git 权限。

获授权后，删除整个 `manage` 映射，明确选择两个新设置，建议从 off/ask 开始。同时检查项目自有 AGENTS 说明与 JSON 消费者。`rsp config` 和 `rsp update` 遇到旧配置或新旧混用会拒绝，不自动转换。编辑后用 `rsp config --json` 验证，再用 `rsp update` 刷新受管资产；历史证据保持不变。
