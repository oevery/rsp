工作引用（WorkRef）：`device-discovery-boundary`

已确认该变更只有一个有界模块设计问题，并已将设计结果回写同一工作引用的 `## Design`。

已确定：

- 所有者：`client/packages/device-discovery` 负责纯事件投影；桌面运行时负责硬件发现与连接生命周期。
- 依赖方向：桌面适配器 → 运行时中立投影 → Web 展示消费者。
- 缝合点：唯一公共纯函数 `projectDeviceEvent`；修剪并校验 `id`、保持 `connected`、不修改输入、冻结返回记录。
- 取舍：不在桌面或 Web 重复规范化，也不引入尚无实际变化需求的发现服务接口。
- 缺口：当前没有桌面适配器调用者，因此本变更不包含调用迁移。

仅修改了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-6i61T2/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证已通过：`npx --no-install rsp check --focused`、`git diff --check`。未运行测试；本阶段未改动实现或测试。