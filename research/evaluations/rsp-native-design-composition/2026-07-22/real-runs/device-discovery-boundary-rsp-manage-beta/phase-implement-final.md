已实现运行时中立的设备事件投影边界。

- 修改：[index.ts](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-O4kdEk/client/packages/device-discovery/src/index.ts)
  - 修剪 `id`
  - 空白 `id` 抛错
  - 保留 `connected`
  - 返回冻结的只读对象
- 更新：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-O4kdEk/.rsp/changes/device-discovery-boundary.md)，记录实现完成和测试证据。

已验证：`mise exec -- pnpm test -- device-discovery` 通过，2 项测试均通过。

未验证：接收器硬件验收仍不可用且由人工负责；固定范围审查与 Core 持久化决策尚未执行。未暂存、提交或进行任何 Git 生命周期操作。

## RSP 续办

- 工作引用（WorkRef）：`device-discovery-boundary`
- 授权范围：同一 Change、`client/packages/device-discovery` 和既有聚焦测试
- 当前状态：部分完成；实现与自动化验证完成
- 已改动工件：`.rsp/changes/device-discovery-boundary.md`、`client/packages/device-discovery/src/index.ts`
- 最新验证：`mise exec -- pnpm test -- device-discovery` 通过
- 阻塞项：接收器硬件验收不可用，由人工负责
- 后续动作：在单独授权下进行只读固定范围审查，再由 Core 判断持久化更新。