已完成同一工作引用（WorkRef）`device-discovery-boundary` 的模块设计，并且只修改了 Change 的 `## Design`。

- 模块归属：`client/packages/device-discovery` 负责纯事件投影；desktop 继续负责硬件发现与连接生命周期。
- 依赖方向：`desktop runtime -> device-discovery package <- web presentation`。
- 接缝：导出的纯同步 `projectDeviceEvent(input)`；负责 trim、空 id 拒绝、冻结新记录，且不接触设备或连接状态。
- 备选方案已比较并排除：不将规范化放入 desktop adapter 或 web。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件验收仍不可用，归属人工。

## 后续衔接

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：设计问题已解决，Change 仅更新 `## Design`
- 已修改工件：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-V4VgUR/.rsp/changes/device-discovery-boundary.md:15)
- 阻塞项：无
- 下一步：在同一工作引用内实施纯投影及聚焦测试。