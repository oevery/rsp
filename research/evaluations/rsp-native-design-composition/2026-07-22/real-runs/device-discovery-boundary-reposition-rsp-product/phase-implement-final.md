已完成选定的运行时中立设备事件投影边界。

- 修改 [index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LNm6ZH/client/packages/device-discovery/src/index.ts)：`projectDeviceEvent` 现在修剪 `id`、拒绝空值，并返回冻结的不可变投影。
- 更新 [device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-LNm6ZH/.rsp/changes/device-discovery-boundary.md)：勾选设计与实现任务，写入本次验证证据。
- 验证通过：`mise exec -- pnpm test -- device-discovery`，2 通过、0 失败。
- 未验证：接收器硬件验收仍不可用，且由人工负责。
- 未执行：暂存、提交、推送、合并、发布或部署。

## RSP 续办

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：部分完成；实现与聚焦测试完成。
- 阻塞项：接收器硬件验收不可用，由人工负责。
- 后续动作：对固定范围执行只读审查，并由 Core 决定稳定事实的持久化路由。