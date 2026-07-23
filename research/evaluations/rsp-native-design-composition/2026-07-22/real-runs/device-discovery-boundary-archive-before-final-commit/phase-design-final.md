## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 设计问题：确定设备事件投影的模块所有者、依赖方向与接缝。
- 建议：桌面适配器保留物理发现与连接生命周期；`client/packages/device-discovery/src/index.ts` 拥有纯 `projectDeviceEvent` 投影接缝。
- 依赖方向：`desktop adapter -> runtime-neutral device-discovery package -> Web presentation`。
- 接缝约束：投影函数修剪并校验 `id`、返回冻结的新对象；运行时中立包不得打开设备、维护生命周期状态或依赖桌面/Web 模块。
- 已更新：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-aNT6hK/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未修改其他区段。
- 验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 未验证：接收器硬件验收仍不可用且由人工负责。
- 下一步：在同一 `device-discovery-boundary` 实施 `projectDeviceEvent` 及其聚焦测试。