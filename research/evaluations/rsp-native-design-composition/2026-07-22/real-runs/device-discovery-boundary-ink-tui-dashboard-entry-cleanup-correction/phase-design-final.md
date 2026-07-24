## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题已确认并解析：模块所有权、依赖方向与最小 seam。
- 已仅更新同一 Change 的 `## Design`：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-yt7C9D/.rsp/changes/device-discovery-boundary.md:15)
- 所有者：`client/packages/device-discovery` 负责纯事件投影；Desktop 保留硬件发现与连接生命周期，Web 仅消费投影结果。
- 依赖方向：Desktop → `projectDeviceEvent` → 下游展示；运行时中立包不得依赖 Desktop/Web 或访问硬件。
- seam：保持单一同步纯函数；负责 ID 去空白、空 ID 拒绝、`connected` 保持与不可变返回值。
- 备选方案已记录：在 Desktop 或 Web 归一化都会破坏既定边界；新增适配器接口没有观察到的变化点支撑。

已验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未运行实现测试，也未进行硬件验收；未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或持久化文档。