已完成设计解析并仅更新同一 Change 的 `## Design`：

- WorkRef：`device-discovery-boundary`
- 模块归属：`client/packages/device-discovery`
- 依赖方向：desktop adapter → runtime-neutral package → Web projection；禁止反向依赖或 Web 硬件发现。
- 缝：保留 `projectDeviceEvent(input)`，负责 trim、空 id 拒绝、不可变投影；不承载生命周期或硬件 I/O。
- 备选方案及取舍已记录。

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或任何 durable 文档。