已创建稳定架构事实文档：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-DYWFaO/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 要写入的事实：
  - Desktop 保留硬件发现与连接生命周期所有权；Web 仅消费投影。
  - `projectDeviceEvent` 是纯 runtime-neutral 的冻结事件投影边界，修剪并拒绝空 `id`，保持 `connected`。
  - 硬件验收不可用，且不能由自动化测试替代。
- 决策记录（Decision Record）：No Decision Record needed
- 决策记录目标：N/A
- 要写入的理由：
  - 无；本次没有需要单独长期保存的不可逆权衡。
- 可归档（Archive ready）：no

验证通过：`node --test test/device-discovery.test.mjs`，3 项通过、0 项失败；文档空白检查通过。未执行硬件验收，仍由人类负责。未修改 Change、代码或测试，未执行任何 Git 生命周期操作。

## 后续

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：blocked；硬件验收仍不可用。
- 下一步：由硬件验收负责人完成接收器验收后，再决定是否满足归档条件。