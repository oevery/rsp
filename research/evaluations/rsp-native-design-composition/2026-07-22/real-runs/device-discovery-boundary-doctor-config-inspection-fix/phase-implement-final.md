已实现设备发现事件投影边界，并更新同一变更单的任务与验证证据。

## RSP 后续事项

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：部分完成；聚焦实现与测试已通过。
- 已修改的文件：
  - `client/packages/device-discovery/src/index.ts`
  - `.rsp/changes/device-discovery-boundary.md`
- 新鲜验证：`mise exec -- pnpm test -- device-discovery`，2/2 通过。
- 未完成项：固定范围只读审查、Core 持久化事实决策。
- 阻塞项：接收器硬件验收不可用，归人工负责；未声称硬件验收通过。
- 后续动作：在独立授权下进行只读审查与持久化决策。