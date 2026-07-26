已完成同一工作引用（WorkRef）`device-discovery-boundary` 的设计回写。

仅修改了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，明确：

- 运行时中立包拥有事件规范化；桌面运行时保留物理发现与连接生命周期。
- 依赖方向为 desktop adapter → `device-discovery` → 展示层。
- seam 为纯函数 `projectDeviceEvent`：修剪标识、空值抛出 `TypeError`、返回冻结的只读投影。
- 单元验证范围及不采纳的替代位置。

验证已通过：`git diff --check` 与 `npx --no-install rsp check --focused`。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或持久化文档；未进行任何 Git 生命周期操作。