已完成模块设计并回写同一工作引用（WorkRef）`device-discovery-boundary`。

- 模块所有者：`client/packages/device-discovery`
- 依赖方向：Desktop → runtime-neutral package → Web
- 接缝：纯函数 `projectDeviceEvent`；负责规范化、空 ID 拒绝与不可变投影
- 已排除：桌面端或 Web 承担规范化，以及无实际调用需求的通用服务/事件总线

仅修改了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-m60Zn7/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未运行实现测试，未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档；硬件验收仍不可用且归人工负责。