# 配置参考

项目配置位于 `.rsp/config.yaml`。省略可选映射时保留兼容默认值；配置永远不会扩展权限。

## Change 类型

内置 Change 类型为 `feature`、`fix`、`refactor`、`docs`、`ops` 与 `research`。非空配置列表会替换而不是扩展默认值，每个条目必须是唯一的非空字符串。

```yaml
kinds:
  - feature
  - fix
  - docs
```

## 持久化语言

```yaml
language:
  default: en
  artifacts: zh-CN
  commit: en
```

存在 `language` 映射时，`default` 必填。它为持久化产物与提交说明提供默认值；可选的 `artifacts` 和 `commit` 覆盖相应内容。值使用规范化的 BCP 47 语言标签。

回复语言仍由用户和会话决定，不能通过 `language.response` 配置。已有产物保持既有语言，除非明确授权翻译。规范标题、命令、路径、标识符、Conventional Commit 类型与作用域、尾注、机器值和 WorkRefs 不本地化。

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
  closeout: lifecycle
```

`activation` 接受 `explicit` 或 `auto`。在保留专门路由与完整小工作例外后，Core 会先解析一个 shape-ready owner，并独占首次 Manage 资格判断及 `selected | declined` 路由结果；缺少或未就绪的归属直接进入 Shape，并在 Manage 资格判断前返回 Core。已选择的 Manage 只根据当前 owner、权限与归属差异证据校验 handoff，不重复判断 direct 还是 managed。自动激活不会把尚无 owner 的工作交给 Manage，也不授予规划、产品修改、生命周期或外部操作权限。

`closeout` 接受：

- `manual`：不自动归档或提交。
- `lifecycle`：成功完成持久化审查后可以归档；提交仍然独立。
- `local`：自动归档符合条件、已验证、非小型且归属边界干净、路径精确、无混杂或越界改动的受管终态边界，并把这些精确路径一次性路由到本地 Commit，无需用户再次请求。

省略 `manage` 时，兼容默认值解析为 `activation: explicit` 与 `closeout: local`。最近的项目限制与宿主强制规则只能缩小这些上限。RSP 有意不提供 `full` 预设；推送、标签、发布、部署、批准与人工验收保持显式。

选择行为见 [Skills 与受管工作](../guides/skills.md)。
