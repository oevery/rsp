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

`activation` 接受 `explicit` 或 `auto`。Core 会先解析一个 shape-ready owner，并独占首次 Manage 资格判断及 `selected | declined` 路由结果。自动选择必须存在可观察的协调义务，例如独立切片、恢复、不同的执行与验收 owner、真实宿主验证、有界 Review 收敛、受管 lifecycle 或 ready successor；多个文件或文档表面本身不构成资格。缺少或未就绪的归属先进入 Shape。已选择的 Manage 校验 handoff，但不重复判断 direct 还是 managed。激活不会授予规划、产品修改、生命周期或外部操作权限。

`closeout` 接受：

- `manual`：不自动归档或提交。
- `lifecycle`：成功完成持久化审查后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

省略 `manage` 时，兼容默认值解析为 `activation: explicit` 与 `closeout: local`。最近的项目限制与宿主强制规则只能缩小这些上限。RSP 有意不提供 `full` 预设；推送、标签、发布、部署、批准与人工验收保持显式。

选择行为见 [Skills 与受管工作](../guides/skills.md)。

## Workspace 策略

```yaml
workspace:
  activation: auto
```

`activation` 接受：

- `auto`：Core 可以在存在并行 Change、无关 dirty work、独立运行时边界或显式 workspace 请求时选择隔离。
- `explicit`：Core 只能为当前显式 workspace 请求选择隔离。
- `disabled`：RSP 不选择或准备隔离 workspace。

生成和回填的默认值是 `auto`，用于保持现有隔离行为。没有 `workspace` 的有效旧配置同样解析为 `auto`；无效配置则让 Workspace 安全失败为 `disabled`。

该设置只是策略上限，不授予 workspace 创建、实现、清理、丢弃、回迁、Git 或外部操作权限。Workspace 路径仍跟随宿主缓存位置，分支固定为 `rsp/<work-ref>`，目标分支仍由命令明确指定，破坏性清理保持显式。
