## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题：模块归属、依赖方向与 seam；结论已回写同一 Change 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 负责纯事件投影；Desktop 保留硬件发现与连接生命周期所有权。
- 依赖方向：Desktop 原始记录 → runtime-neutral 投影 → Web typed consumer；禁止投影包依赖 Desktop/Web 或持有硬件状态。
- 边界（seam）：`projectDeviceEvent(input)`，负责 trim、空 ID 拒绝、不可变投影，`connected` 原样传递。
- 替代方案：未将规范化留在 Desktop，避免未来消费者耦合物理运行时；未新增 adapter interface，因没有第二个已观察实现。

- 已改文件：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-kcADaO/.rsp/changes/device-discovery-boundary.md:15)
- 新鲜验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未运行实现测试；本阶段仅允许设计文档变更。
- 阻塞：无；接下来由同一 `device-discovery-boundary` 进入受授权的实现阶段。