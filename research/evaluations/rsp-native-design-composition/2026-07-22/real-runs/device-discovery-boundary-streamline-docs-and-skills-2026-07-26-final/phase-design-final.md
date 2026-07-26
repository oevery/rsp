已完成同一工作引用（WorkRef）`device-discovery-boundary` 的设计回写。

- 模块归属：桌面运行时拥有物理发现与连接生命周期；`device-discovery` 仅做纯事件投影。
- 依赖方向：desktop adapter → runtime-neutral projection → Web。
- 接缝：`projectDeviceEvent` 负责修剪、拒绝空 ID、返回不可变投影；不承担订阅、重试或连接状态。
- 替代方案：拒绝把规范化留在桌面适配器或把生命周期移入中立包。
- 已记录现有证据缺口：fixture 中没有桌面适配器或 Web 调用者；硬件验收仍不可用。

仅修改了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。未修改代码、测试、任务、验证项、阻塞项或架构文档，未执行任何 Git 生命周期操作。

工作引用（WorkRef）：`device-discovery-boundary`  
下一步：在同一工作引用下按该设计实现投影和聚焦测试。