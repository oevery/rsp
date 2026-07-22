已写入 [设备发现边界文档](docs/architecture/device-discovery-boundary.md)。

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `docs/architecture/device-discovery-boundary.md`
- Facts to write:
  - 桌面、Web 与运行时无关包的设备发现职责边界。
  - 当前 `projectDeviceEvent` 的字段投影事实。
  - 硬件验收不可用且由人工负责。
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none
- Archive ready: no

验证：文档内容已复核，`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未运行测试；Change 任务仍未完成，硬件验收仍为 `unavailable; human owned`。