## 设计结论

- 工作引用（WorkRef）: `device-discovery-boundary`
- 设计问题: 已确认是单一、可界定的问题：确定设备事件投影的模块归属、依赖方向与接口边界。
- 建议: `client/packages/device-discovery` 负责纯事件投影；桌面端负责物理发现与连接生命周期；Web 只能消费投影后的记录。
- 接口边界: 保留同步的 `projectDeviceEvent(input)`；修剪 `id`、拒绝空值、保留 `connected`、返回新的冻结记录；不承担设备 I/O、生命周期或配置。
- 备选方案: 未将规范化放进桌面适配器，也未暴露 Web 发现接口，避免耦合或突破硬件所有权边界。
- 已修改: 仅更新 [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-Et9SVu/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 验证: `git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未验证: 未运行实现测试；硬件接收器验收仍不可用且由人工负责。
- 下一步: 由同一工作引用（WorkRef）执行设计任务并进入实现阶段。