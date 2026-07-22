## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-Tky8s7/docs/architecture/device-discovery-boundary.md)
- 写入事实：
  - Desktop runtime 拥有物理发现与连接生命周期；Web 只消费投影数据。
  - 运行时中立包负责同步、不可变的事件投影与空 ID 校验。
  - 硬件验收仍不可用，自动化测试不能替代它。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 可归档（Archive ready）：no

仅新增指定架构文档，未修改 Change 或代码，也未执行任何 Git 生命周期操作。

验证：`mise exec -- pnpm test -- device-discovery` 通过（2 passed，0 failed）；`git diff --check` 通过。接收器硬件验收未执行，仍由人工负责。