## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题：已确认；设计结论已回写同一工作引用。
- 模块归属：`client/packages/device-discovery` 负责纯事件投影；桌面端独占硬件发现与连接生命周期。
- 依赖方向：desktop adapter → `device-discovery` → desktop/Web consumers；包不得依赖桌面、浏览器、Electron 或硬件 API。
- 接缝：保留纯同步 `projectDeviceEvent`，修剪 `id`、拒绝空值、返回新建不可变投影；不管理设备、状态或事件订阅。
- 变更：仅更新 [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-XcoTDd/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件验收不可用，仍由人工负责。
- 下一步：在同一 `device-discovery-boundary` 实现投影与聚焦单元测试。