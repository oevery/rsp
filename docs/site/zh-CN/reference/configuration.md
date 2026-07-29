# 配置参考

项目配置位于 `.rsp/config.yaml`。省略可选 mapping 时保留兼容默认值；配置永远不会扩展权限。

## Change kinds

内置 Change kinds 为 `feature`、`fix`、`refactor`、`docs`、`ops` 与 `research`。非空配置列表会替换而不是扩展默认值，每个 entry 必须是唯一的非空字符串。

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

存在 `language` mapping 时，`default` 必填。它为 durable artifacts 与 commit prose 提供默认值；可选的 `artifacts` 和 `commit` 覆盖相应 surface。值使用规范化 BCP 47 language tag。

Response language 仍由用户和会话所有，不能通过 `language.response` 配置。已有 artifact 保持既有语言，除非明确授权翻译。Canonical headings、commands、paths、identifiers、Conventional Commit types 与 scopes、trailers、machine values 和 WorkRefs 不本地化。

## Decision Records

Decision Records 默认位于 `.rsp/specs/decisions/`。如果 Host Project 已在其他位置拥有 ADR，只配置一个项目相对的权威目录：

```yaml
decisions:
  path: docs/adr
```

该 path 不能是绝对路径、不能逃逸 Host Project，也不能指向其他 `.rsp/` core location。切换 path 不会迁移已有 records。在项目迁移或明确删除旧记录前，`rsp doctor` 会报告遗留在默认目录的 inactive records。

## Manage policy

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` 接受 `explicit` 或 `auto`。Automatic activation 允许 Core 为符合条件的工作选择 controller，不授予 mutation 或 lifecycle 权限。

`closeout` 接受：

- `manual`：不自动 archive 或 commit。
- `lifecycle`：成功 durable review 后可以 archive；commit 仍然独立。
- `local`：在 lifecycle closeout 基础上，允许符合条件、clean、已验证、非小型终态边界执行一次有独立依据的 local commit。

省略 `manage` 时，兼容默认值解析为 `activation: explicit` 与 `closeout: local`。Nearest project restrictions 与 host enforcement 只能缩小这些上限。RSP 有意不提供 `full` preset；push、tag、publication、deployment、approval 与 human acceptance 保持显式。

选择行为见 [Skills 与 managed work](../guides/skills.md)。
