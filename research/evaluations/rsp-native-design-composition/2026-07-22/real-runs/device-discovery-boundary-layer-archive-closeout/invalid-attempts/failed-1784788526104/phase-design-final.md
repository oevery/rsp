## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：一个有界设计问题，且已回写至同一 Change 的 `## Design`。
- 模块所有者：`client/packages/device-discovery` 负责纯事件投影；桌面运行时保留发现与连接生命周期。
- 依赖方向：desktop adapter → `device-discovery` → typed presentation consumers；投影包不得依赖桌面或 Web。
- 接口缝：公共 `projectDeviceEvent(input)`，负责修剪、拒绝空 ID、保留连接状态并返回冻结的新记录。
- 修改文件：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-c3C7OY/.rsp/changes/device-discovery-boundary.md:15)

## 验证情况

- `npx --no-install rsp check --focused`：通过。
- `git diff --check`：通过。
- 未运行实现测试；本阶段未修改代码或测试。
- 接收器硬件验收仍不可用，且未声称通过。