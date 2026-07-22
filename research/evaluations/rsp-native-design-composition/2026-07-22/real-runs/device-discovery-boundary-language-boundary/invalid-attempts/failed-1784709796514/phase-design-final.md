已完成同一工作引用（WorkRef）的设计回写：`.rsp/changes/device-discovery-boundary.md` 的 `## Design`。

- 已确认该 Change 只有一个有界设计问题，且结果返回 `device-discovery-boundary`。
- 明确了 owner：`client/packages/device-discovery`。
- 明确依赖方向：desktop adapter → runtime-neutral package → typed consumers。
- 定义最小接缝：`projectDeviceEvent` 的输入、输出、不变量与非职责。
- 未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或持久化文档。
- 验证通过：`git diff --check`；`npx --no-install rsp check --focused`。

硬件验收仍不可用，归人工负责。