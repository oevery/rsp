WorkRef：`device-discovery-boundary`

已确认该 Change 只有一个有界设计问题，设计结果已回写到同一 WorkRef 的 `## Design`：

- Owner：`client/packages/device-discovery`
- 依赖方向：desktop adapter → runtime-neutral projection → 上层消费者
- Seam：单一 `projectDeviceEvent(input)`，负责 trim、空 id 拒绝、不可变 typed projection；不承担硬件发现或连接生命周期
- 已记录替代方案、验证面及当前夹具缺少真实 adapter/consumer 的证据缺口

仅修改了 [.rsp/changes/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-l9LxQ5/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或 durable 文档；未进行任何 Git lifecycle 操作。