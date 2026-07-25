## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认这是一个单一、有界的模块设计问题，设计结论已回写同一 Change 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 负责纯投影；桌面运行时保留硬件发现与连接生命周期。
- 依赖方向：`desktop adapter -> device-discovery -> Web presentation`。
- 缝隙：导出的纯函数 `projectDeviceEvent(input)`；负责修剪、空值拒绝、保留连接状态、返回新建冻结对象，且不修改输入。
- 未改动代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档。

## 验证结果

`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。硬件接收器不可用，未进行硬件验收。