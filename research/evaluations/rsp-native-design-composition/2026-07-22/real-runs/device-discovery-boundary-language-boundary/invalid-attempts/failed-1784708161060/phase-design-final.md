已完成 `device-discovery-boundary` 的有界模块/seam 设计，并仅更新同一 Change 的 `## Design`。

- WorkRef：`device-discovery-boundary`
- 结论：`client/packages/device-discovery` 负责纯事件投影；依赖方向为 desktop adapter → projection → typed consumers；`projectDeviceEvent` 是公开 seam。
- 记录了替代方案、测试面，以及缺少真实 desktop 调用方和硬件验收的证据缺口。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或 durable 文档；未执行任何 Git 生命周期操作。

## RSP 延续
- WorkRef：`device-discovery-boundary`
- 当前状态：设计已完成；实现尚未开始
- 已修改工件：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-uKBSEZ/.rsp/changes/device-discovery-boundary.md:16)
- 新鲜验证：`npx --no-install rsp check --focused` 通过
- 阻塞项：无
- 下一步：在同一 WorkRef 中实现该纯投影及聚焦测试。