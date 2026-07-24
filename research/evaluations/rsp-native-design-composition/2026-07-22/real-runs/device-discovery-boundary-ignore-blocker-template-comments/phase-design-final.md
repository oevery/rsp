## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 有界问题：已确认，仅为模块所有者、依赖方向与接缝设计。
- 结论：桌面适配器拥有物理发现与连接生命周期；`client/packages/device-discovery` 拥有纯同步投影接缝；依赖方向为 desktop → runtime-neutral package → Web。
- 接缝：`projectDeviceEvent(input)` 接收原始记录，返回新的冻结 `{ id, connected }`，修剪 `id` 并拒绝空值。
- 已更新：[.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-m40EC7/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未修改任何其他文件或章节。
- 验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 备选方案：将规范化留在 desktop 会耦合硬件与共享数据契约；由 Web 处理会违反其不得直接参与硬件发现的边界。
- 下一步：在同一 `device-discovery-boundary` 内实施投影与聚焦测试；硬件验收仍不可用且由人工负责。