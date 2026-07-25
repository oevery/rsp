已完成 runtime-neutral 投影边界及聚焦测试。

- 已实现 `projectDeviceEvent`：修剪 id、拒绝空 id、保留 connected、返回冻结的新对象。
- 测试覆盖输出不可变、输入不被修改与空 id 拒绝。
- 已更新 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-eJc6N7/.rsp/changes/device-discovery-boundary.md)。

## 当前状态

- 工作引用（WorkRef）：`device-discovery-boundary`
- 新鲜验证：`mise exec -- pnpm test -- device-discovery` 通过，2 项通过、0 项失败。
- 未完成项：固定范围只读审查、持久化审查；接收器硬件验收仍不可用且由人工负责。
- 未执行：暂存、提交、发布或任何 Git 生命周期操作。