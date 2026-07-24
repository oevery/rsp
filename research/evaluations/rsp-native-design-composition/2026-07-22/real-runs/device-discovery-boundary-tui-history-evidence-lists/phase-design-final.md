## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 单一问题：已确认仅解决模块所有权、依赖方向与接缝，且结果已回写同一 Change。
- 建议：`client/packages/device-discovery` 仅拥有纯投影；desktop 保留发现与连接生命周期；web 不直接发现硬件。
- 接缝：同步无状态的 `projectDeviceEvent`，负责 trim、空 ID 拒绝、保留 `connected`、返回冻结的新对象。
- 备选方案：拒绝在 desktop 混入可复用值策略、在 web 投影，及当前无需求的发现接口层级。
- 已修改：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-j5nwYf/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未改动代码、测试、文档、Tasks、Verify 或 Blockers。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：未运行实现测试；接收器硬件验收仍不可用且由人工负责。