## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 单一设计问题：已确认，聚焦模块所有者、依赖方向与事件投影接缝；结论已回写同一 Change。
- 模块所有者：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent` 投影；桌面适配器拥有硬件发现、连接生命周期与调用职责。
- 依赖方向：桌面适配器可依赖运行时中立包；该包不得依赖桌面或 Web。事件仅从桌面流向展示层。
- 接缝：同步 `projectDeviceEvent`，负责修剪 ID、拒绝空 ID、保留连接状态并返回冻结投影；不拥有设备句柄、监听器、传输或重试策略。
- 备选方案：将规范化放在桌面会混合硬件生命周期与复用策略；放在 Web 则违反边界；没有证据支持额外适配接口。

## 已修改内容

- 仅更新了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-uBMkAw/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。
- 未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或架构文档。

## 验证情况

- `npx --no-install rsp check --focused`：通过。
- `git diff --check`：通过。
- 接收器硬件验收：不可用，未执行。

## 后续动作

由同一工作引用（WorkRef）`device-discovery-boundary` 进入实现阶段，新增桌面适配器对该公共投影函数的实际调用并运行聚焦测试。