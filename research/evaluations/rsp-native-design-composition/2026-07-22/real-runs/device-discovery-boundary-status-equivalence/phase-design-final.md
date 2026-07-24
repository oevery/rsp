## 设计结果

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已确认：该 Change 只有一个有界设计问题，设计结论已回写同一 WorkRef 的 `## Design`。
- 模块所有权：`client/packages/device-discovery` 负责纯投影；桌面运行时负责物理发现与连接生命周期。
- 依赖方向：桌面适配器 → `projectDeviceEvent` → 展示消费者；runtime-neutral 包不得依赖桌面或硬件 API。
- 接缝：`projectDeviceEvent` 是唯一投影接缝，负责 ID 规范化、空 ID 拒绝、连接状态保留和不可变输出。
- 已拒绝：将规范化留在适配器，以及当前没有证据支撑的 discovery interface / event bus。
- 已知缺口：fixture 不存在桌面适配器或展示消费者，无法证明真实硬件链路集成；硬件验收仍不可用且由人工负责。

仅修改了 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-hQS4vp/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未执行代码或硬件测试，未暂存、提交或进行其他 Git 生命周期操作。