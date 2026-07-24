## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 单一问题：已确认是模块 owner、依赖方向与 seam，且结论已回写同一 WorkRef。
- 建议：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent`；desktop 仅依赖它进行投影，继续独占物理发现与连接生命周期。
- 已更新：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-lyrWtO/.rsp/changes/device-discovery-boundary.md:16) 的 `## Design`，未改动其他段落、代码、测试或架构文档。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证：接收器硬件不可用，硬件验收仍由人工负责。
- 下一步：在同一 `device-discovery-boundary` 实施该纯投影函数与聚焦单测。