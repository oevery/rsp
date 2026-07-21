WorkRef：`device-discovery-boundary`

设计工件已写入：[docs/architecture/device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-daily-workflow-depth/j3-module-seam/j3-module-seam-NQQNHz/docs/architecture/device-discovery-boundary.md)。

结论：Desktop runtime 拥有设备发现与连接生命周期；Web 仅消费类型化投影；runtime-neutral package 仅承载纯 `projectDeviceEvent` 规整逻辑。

已运行指定验证，当前失败（符合尚未实现的设计阶段）：`id` 未修剪，空 `id` 未被拒绝。未执行真实 receiver hardware 验收，按不可用边界停止。未 commit、push 或 deploy。