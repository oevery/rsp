已完成同一变更的设计澄清并回写至 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-5kdKLN/.rsp/changes/device-discovery-boundary.md:15)。

工作引用（WorkRef）：`device-discovery-boundary`

结论：物理发现归桌面运行时；`client/packages/device-discovery` 仅拥有纯事件投影。依赖方向为桌面/Web → 运行时中立包，边界是 `projectDeviceEvent`，负责规范化、空值拒绝与不可变投影。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。

未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档；硬件验收仍不可用且人工负责。