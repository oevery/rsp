已完成同一工作引用（WorkRef）`device-discovery-boundary` 的设计解析并更新其 `## Design`。

- 确认问题有界：模块归属、依赖方向与投影接缝。
- 归属：`client/packages/device-discovery` 负责纯投影；桌面端保留硬件发现与生命周期。
- 方向：desktop adapter → runtime-neutral package。
- 接缝：`projectDeviceEvent` 负责修剪、空 ID 拒绝、不可变投影。
- 未修改代码、测试、文档、任务、验证项或阻塞项。

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。