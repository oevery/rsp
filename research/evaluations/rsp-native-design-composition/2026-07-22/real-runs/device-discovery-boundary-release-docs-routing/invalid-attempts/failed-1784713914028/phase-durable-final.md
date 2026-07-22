已写入 [设备发现边界架构文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-x5JsLQ/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实（Current facts）：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：
  - 桌面运行时拥有物理发现与连接生命周期。
  - 运行时中立包负责不可变事件投影，Web 不直接发现硬件。
  - 投影契约、依赖方向与生命周期策略边界已明确。
  - 接收器硬件验收仍不可用，且由人工负责。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 写入理由：无
- 可归档（Archive ready）：no

验证已通过：`git diff --check` 与 `mise exec -- pnpm test -- device-discovery`（2 通过，0 失败）。

未修改 Change、代码或测试；审查指出的 Change 任务归属问题仍保留，因其不在本次写入授权内。