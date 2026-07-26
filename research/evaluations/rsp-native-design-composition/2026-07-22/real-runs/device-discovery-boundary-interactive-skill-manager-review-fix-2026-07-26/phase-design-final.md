已将设计结论写回同一 Change。

- 工作引用（WorkRef）：`device-discovery-boundary`
- 结论：由 `client/packages/device-discovery` 负责纯事件投影；依赖方向为桌面适配器 → 运行时中立包 → Web；接缝为唯一的 `projectDeviceEvent` 公共入口。
- 修改：[device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未修改其他章节、代码、测试或文档。
- 验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 风险：夹具没有桌面适配器实际调用方，运行时交接依据项目约束而非可追踪生产路径；硬件验收仍不可用。